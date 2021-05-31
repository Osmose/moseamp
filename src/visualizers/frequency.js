export default {
  id: 'frequency',
  name: 'Frequency',
  icon: {
    code: 'chart-bar',
  },
  draw(canvas, analysis) {
    const ctx = canvas.getContext('2d');
    const { frequencyData } = analysis;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'hsl(0, 0%, 15%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!frequencyData) {
      return;
    }

    ctx.beginPath();
    const sliceWidth = ((canvas.width * 1.0) / frequencyData.length) * 2.5;
    for (let i = 0; i < frequencyData.length; i++) {
      const v = frequencyData[i] / 255.0;
      const y = v * canvas.height;
      ctx.fillStyle = `hsl(217, 64%, ${Math.floor(v * 100)}%)`;
      ctx.fillRect(i * sliceWidth + i, canvas.height - y, sliceWidth, y);
    }
  },
};
