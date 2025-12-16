import * as ort from 'onnxruntime-web';
import { mapIndexToLabel, getSaran, getDeskripsi, getSeverity } from './classLabels';

class OnnxService {
  private session: ort.InferenceSession | null = null;
  private modelPath = './api/model/Model_CNN_256px.keras';

  async loadModel() {
    if (!this.session) {
      const res = await fetch(this.modelPath);
      this.session = await ort.InferenceSession.create(await res.arrayBuffer(), { executionProviders: ['wasm'] });
    }
  }

  async predict(imageFile: File) {
    await this.loadModel();

    const tensor = await this.preprocessImage(imageFile, 256); // sesuaikan input size model
    const results = await this.session!.run({ [this.session!.inputNames[0]]: tensor });

    const outputTensor = results[this.session!.outputNames[0]] as ort.Tensor;
    const data = Array.from(outputTensor.data as Float32Array);

    const maxIndex = data.indexOf(Math.max(...data));
    return {
    classId: maxIndex,
    className: mapIndexToLabel(maxIndex),
    saran: getSaran(maxIndex),
    deskripsi: getDeskripsi(maxIndex),
    tingkatKeparahan: getSeverity(maxIndex),
    confidence: data[maxIndex] * 100
    };
  }

  private async preprocessImage(imageFile: File, size: number) {
    return new Promise<ort.Tensor>((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => { img.src = e.target?.result as string; };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject();

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = Float32Array.from(imageData.data).filter((_, i) => i % 4 !== 3); // hapus alpha
        for (let i = 0; i < data.length; i++) data[i] /= 255.0;

        resolve(new ort.Tensor('float32', data, [1, size, size, 3]));
      };
      reader.readAsDataURL(imageFile);
    });
  }
}

export const onnxService = new OnnxService();
