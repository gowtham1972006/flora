import torch

ckpt = torch.load('checkpoints/global_final.pt', map_location='cpu', weights_only=False)
print('=== CHECKPOINT CONTENTS ===')
for k, v in ckpt.items():
    if k != 'model_state_dict':
        print(f'  {k}: {v}')
print(f'  model_state_dict keys: {len(ckpt["model_state_dict"])} tensors')
sizes = [v.numel() for v in ckpt['model_state_dict'].values()]
print(f'  total params: {sum(sizes):,}')
