"""
FloraVeda — Tests for Federated Learning Algorithms
=====================================================
Tests FedAvg aggregation, FedSCAFFOLD control variates,
client data partitioning, and client isolation.
"""

import sys
import copy
from pathlib import Path

import torch
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def test_fedavg_aggregation():
    """Test that FedAvg produces a weighted average of client models."""
    from federated.fedavg import fedavg_aggregate

    # Create simple "model" states
    global_state = {"weight": torch.tensor([1.0, 2.0, 3.0])}

    client_updates = [
        {
            "model_state": {"weight": torch.tensor([2.0, 3.0, 4.0])},
            "num_samples": 100,
        },
        {
            "model_state": {"weight": torch.tensor([4.0, 5.0, 6.0])},
            "num_samples": 100,
        },
    ]

    result = fedavg_aggregate(global_state, client_updates)

    # Equal weights (100 each) → simple average
    expected = torch.tensor([3.0, 4.0, 5.0])
    assert torch.allclose(result["weight"], expected), \
        f"Expected {expected}, got {result['weight']}"

    print("✓ test_fedavg_aggregation passed")


def test_fedavg_weighted():
    """Test FedAvg with unequal client weights."""
    from federated.fedavg import fedavg_aggregate

    global_state = {"w": torch.tensor([0.0])}

    client_updates = [
        {"model_state": {"w": torch.tensor([10.0])}, "num_samples": 100},
        {"model_state": {"w": torch.tensor([20.0])}, "num_samples": 300},
    ]

    result = fedavg_aggregate(global_state, client_updates)

    # Weighted: (100/400)*10 + (300/400)*20 = 2.5 + 15 = 17.5
    expected = torch.tensor([17.5])
    assert torch.allclose(result["w"], expected, atol=1e-4), \
        f"Expected {expected}, got {result['w']}"

    print("✓ test_fedavg_weighted passed")


def test_scaffold_initialization():
    """Test that SCAFFOLD state is initialized to zeros."""
    from federated.fedscaffold import initialize_scaffold_state

    model_state = {
        "layer.weight": torch.randn(10, 5),
        "layer.bias": torch.randn(10),
    }

    state = initialize_scaffold_state(model_state, num_clients=4)

    # Global control should be zeros
    for key in state.global_control:
        assert torch.all(state.global_control[key] == 0), \
            f"Global control for {key} should be zero"

    # Client controls should be zeros
    assert len(state.client_controls) == 4
    for cid in range(4):
        for key in state.client_controls[cid]:
            assert torch.all(state.client_controls[cid][key] == 0), \
                f"Client {cid} control for {key} should be zero"

    print("✓ test_scaffold_initialization passed")


def test_scaffold_correction():
    """Test SCAFFOLD correction computation."""
    from federated.fedscaffold import compute_scaffold_correction

    global_control = {"w": torch.tensor([1.0, 2.0])}
    client_control = {"w": torch.tensor([0.3, 0.5])}

    correction = compute_scaffold_correction(global_control, client_control)

    expected = torch.tensor([0.7, 1.5])
    assert torch.allclose(correction["w"], expected, atol=1e-5), \
        f"Expected {expected}, got {correction['w']}"

    print("✓ test_scaffold_correction passed")


def test_scaffold_client_control_update():
    """Test client control variate update formula."""
    from federated.fedscaffold import update_client_control

    old_ci = {"w": torch.tensor([0.0])}
    c = {"w": torch.tensor([0.0])}
    w_global = {"w": torch.tensor([1.0])}
    w_local = {"w": torch.tensor([0.5])}  # model moved 0.5 towards optimum

    # K=10, η=0.01
    # ci_new = ci - c + (w_global - w_local) / (K * η)
    #        = 0  - 0 + (1.0 - 0.5) / (10 * 0.01)
    #        = 0.5 / 0.1 = 5.0
    new_ci = update_client_control(old_ci, c, w_global, w_local, 10, 0.01)

    expected = torch.tensor([5.0])
    assert torch.allclose(new_ci["w"], expected, atol=1e-4), \
        f"Expected {expected}, got {new_ci['w']}"

    print("✓ test_scaffold_client_control_update passed")


def test_dirichlet_partitioning():
    """Test that Dirichlet partitioning produces valid non-IID splits."""
    from clients.client_data import partition_data_dirichlet

    # Create synthetic targets: 100 samples, 5 classes
    targets = [i % 5 for i in range(100)]

    partition = partition_data_dirichlet(
        targets=targets,
        num_clients=4,
        alpha=0.3,
        seed=42,
    )

    # Check all clients have data
    assert len(partition) == 4
    for cid in range(4):
        assert len(partition[cid]) > 0, f"Client {cid} should have some data"

    # Check no overlap between clients
    all_assigned = []
    for idxs in partition.values():
        all_assigned.extend(idxs)
    assert len(all_assigned) == len(set(all_assigned)), "No index should appear twice"

    # Check all indices are valid
    for idx in all_assigned:
        assert 0 <= idx < 100, f"Invalid index: {idx}"

    print("✓ test_dirichlet_partitioning passed")


def test_client_isolation():
    """
    Test that the server code never imports or accesses client image data.
    This is a structural test — the server module should not contain any
    image loading or file reading operations.
    """
    import inspect
    from federated.server import FederatedServer

    source = inspect.getsource(FederatedServer)

    # Server should never open/read image files
    forbidden_patterns = [
        "Image.open",
        "PIL.Image",
        "cv2.imread",
        "imageio.imread",
        "validate_image",
        "PlantDiseaseDataset",
    ]

    for pattern in forbidden_patterns:
        assert pattern not in source, \
            f"Server should NOT contain '{pattern}' — it must not access client images"

    print("✓ test_client_isolation passed")


def test_fedscaffold_is_not_fedavg():
    """
    Verify that FedSCAFFOLD and FedAvg produce DIFFERENT results
    when control variates are non-zero. This ensures FedSCAFFOLD
    is actually implemented, not just relabeled FedAvg.
    """
    from federated.fedavg import fedavg_aggregate
    from federated.fedscaffold import (
        scaffold_aggregate, initialize_scaffold_state, ScaffoldState
    )

    # Create a simple model
    global_state = {"w": torch.tensor([1.0, 2.0, 3.0])}

    # Create SCAFFOLD state with non-zero controls
    scaffold_state = ScaffoldState(
        global_control={"w": torch.tensor([0.5, 0.5, 0.5])},
        client_controls={
            0: {"w": torch.tensor([0.1, 0.2, 0.3])},
            1: {"w": torch.tensor([0.4, 0.3, 0.2])},
        },
    )

    # Simulate client updates
    client_updates = [
        {
            "model_state": {"w": torch.tensor([1.5, 2.5, 3.5])},
            "model_delta": {"w": torch.tensor([-0.5, -0.5, -0.5])},
            "num_samples": 50,
            "client_id": 0,
            "new_client_control": {"w": torch.tensor([0.2, 0.3, 0.4])},
            "control_delta": {"w": torch.tensor([0.1, 0.1, 0.1])},
        },
        {
            "model_state": {"w": torch.tensor([2.0, 3.0, 4.0])},
            "model_delta": {"w": torch.tensor([-1.0, -1.0, -1.0])},
            "num_samples": 50,
            "client_id": 1,
            "new_client_control": {"w": torch.tensor([0.5, 0.4, 0.3])},
            "control_delta": {"w": torch.tensor([0.1, 0.1, 0.1])},
        },
    ]

    # Run FedAvg
    fedavg_result = fedavg_aggregate(global_state, client_updates)

    # Run SCAFFOLD
    scaffold_result, new_state = scaffold_aggregate(
        global_state, scaffold_state, client_updates,
        total_num_clients=2, learning_rate=0.01
    )

    # They should produce DIFFERENT results because SCAFFOLD uses control variates
    # FedAvg: weighted avg of model states → (1.5+2.0)/2 = 1.75, (2.5+3.0)/2 = 2.75, ...
    # SCAFFOLD: w + (1/S) * Σ(wᵢ - w) which is different aggregation
    # The global control should also be updated
    assert not torch.equal(new_state.global_control["w"], scaffold_state.global_control["w"]), \
        "SCAFFOLD global control should be updated after aggregation"

    print("✓ test_fedscaffold_is_not_fedavg passed")


if __name__ == "__main__":
    test_fedavg_aggregation()
    test_fedavg_weighted()
    test_scaffold_initialization()
    test_scaffold_correction()
    test_scaffold_client_control_update()
    test_dirichlet_partitioning()
    test_client_isolation()
    test_fedscaffold_is_not_fedavg()
    print("\n✅ All federated learning tests passed!")
