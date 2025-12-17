import * as ort from 'onnxruntime-web';
import { getSaran, getDeskripsi, getSeverity } from './classLabels';

class OnnxService {
  private session: ort.InferenceSession | null = null;
  private modelPath = '/api/model/temp_cnn.onnx'; // sesuaikan lokasi public

  async loadModel() {
    if (!this.session) {
      const res = await fetch(this.modelPath);
      const buffer = await res.arrayBuffer();

      this.session = await ort.InferenceSession.create(buffer, {
        executionProviders: ['wasm'],
      });
    }
  }

  async predict(imageFile: File) {
    await this.loadModel();

    const inputSize = 224;
    const tensor = await this.preprocessImage(imageFile, inputSize);

    const results = await this.session!.run({
      [this.session!.inputNames[0]]: tensor,
    });

    const outputTensor = results[this.session!.outputNames[0]] as ort.Tensor;
    const value = (outputTensor.data as Float32Array)[0]; // ⬅️ single output

    return {
      value,
      persentase: value * 100,
      saran: getSaran(value),
      deskripsi: getDeskripsi(value),
      tingkatKeparahan: getSeverity(value),
    };
  }

  private async preprocessImage(imageFile: File, size: number) {
    return new Promise<ort.Tensor>((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context error');

        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size);
        const rgba = imageData.data;

        const data = new Float32Array(size * size * 3);
        let j = 0;

        for (let i = 0; i < rgba.length; i += 4) {
          data[j++] = rgba[i] / 255;     // R
          data[j++] = rgba[i + 1] / 255; // G
          data[j++] = rgba[i + 2] / 255; // B
        }

        resolve(new ort.Tensor('float32', data, [1, size, size, 3]));
      };

      reader.readAsDataURL(imageFile);
    });
  }
}

export const onnxService = new OnnxService();
