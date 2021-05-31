export default {
  id: 'signal',
  name: 'Signal',
  icon: {
    code: 'chart-line',
  },
  draw(canvas, analysis) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const { timeDomainData } = analysis;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'hsl(0, 0%, 15%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!timeDomainData) {
      return;
    }

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'hsl(217, 64%, 60%)';
    ctx.beginPath();
    const sliceWidth = canvas.width * 1.0 / timeDomainData.length;
    let x = 0;
    for(let i = 0; i < timeDomainData.length; i++) {
      const v = timeDomainData[i] / 128.0;
      const y = v * canvas.height / 2;

      if(i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  }
};
