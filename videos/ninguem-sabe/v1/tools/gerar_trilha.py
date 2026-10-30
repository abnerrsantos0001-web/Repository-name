# Trilha ambiente sombria gerada localmente com MusicGen (facebook/musicgen-small), semente fixa.
# Uso: <python com torch+transformers> tools/gerar_trilha.py saida.wav  (gera ~30 s; o loop e a mixagem estão em tools/montar_trilha.sh)
import sys, torch, numpy as np, soundfile as sf
from transformers import AutoProcessor, MusicgenForConditionalGeneration
out = sys.argv[1]
torch.manual_seed(7)
torch.set_num_threads(2)
proc = AutoProcessor.from_pretrained("facebook/musicgen-small")
model = MusicgenForConditionalGeneration.from_pretrained("facebook/musicgen-small")
prompt = ("dark ambient drone, slow and eerie, deep low cello and soft analog synth pad, "
          "distant wind, sparse, minimal, no drums, no melody, horror documentary underscore, 60 bpm")
inputs = proc(text=[prompt], padding=True, return_tensors="pt")
with torch.no_grad():
    audio = model.generate(**inputs, do_sample=True, guidance_scale=3.0, max_new_tokens=1500)
sr = model.config.audio_encoder.sampling_rate
wav = audio[0, 0].cpu().numpy().astype(np.float32)
sf.write(out, wav, sr)
print("ok", out, sr, len(wav) / sr)
