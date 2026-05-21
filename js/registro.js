const correoInput   = document.getElementById('correo');
  const passInput     = document.getElementById('password');
  const confirmInput  = document.getElementById('confirmar');
  const btnSubmit     = document.getElementById('btnSubmit');
  const alertMsg      = document.getElementById('alertMsg');
  const strengthFill  = document.getElementById('strengthFill');
  const strengthLabel = document.getElementById('strengthLabel');

  function hint(id, msg) {
    const el = document.getElementById('hint-' + id);
    el.textContent = msg;
    el.classList.toggle('show', !!msg);
  }

  function markInvalid(input, invalid) {
    input.classList.toggle('invalid', invalid);
  }

  function passwordStrength(pw) {
    let score = 0;
    if (pw.length >= 6)  score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  }

  passInput.addEventListener('input', () => {
    const pw = passInput.value;
    const s  = pw ? passwordStrength(pw) : 0;
    const pct = pw ? Math.max(20, s * 20) : 0;
    const colors = ['', '#e07070', '#e0a070', '#c9c96e', '#6bbf8a', '#4da870'];
    const labels = ['', 'Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
    strengthFill.style.width = pct + '%';
    strengthFill.style.background = colors[s] || 'transparent';
    strengthLabel.textContent = pw ? labels[s] : '';
    strengthLabel.style.color = colors[s] || 'var(--muted)';
    if (pw && pw.length < 6) {
      hint('password', 'Mínimo 6 caracteres');
      markInvalid(passInput, true);
    } else {
      hint('password', '');
      markInvalid(passInput, false);
    }
  });

  correoInput.addEventListener('blur', () => {
    const v = correoInput.value.trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (v && !ok) { hint('correo', 'Ingresa un correo válido'); markInvalid(correoInput, true); }
    else          { hint('correo', '');                          markInvalid(correoInput, false); }
  });

  confirmInput.addEventListener('input', () => {
    if (passInput.value && confirmInput.value && passInput.value !== confirmInput.value) {
      hint('confirmar', 'Las contraseñas no coinciden');
      markInvalid(confirmInput, true);
    } else {
      hint('confirmar', '');
      markInvalid(confirmInput, false);
    }
  });

  function showAlert(type, msg) {
    alertMsg.className = 'alert ' + type;
    alertMsg.textContent = msg;
    alertMsg.style.display = 'block';
  }

  document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault();
    alertMsg.style.display = 'none';

    const correo   = correoInput.value.trim();
    const password = passInput.value;
    const confirmar = confirmInput.value;

    let valid = true;

    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      hint('correo', 'Ingresa un correo válido'); markInvalid(correoInput, true); valid = false;
    }
    if (!password || password.length < 6) {
      hint('password', 'Mínimo 6 caracteres'); markInvalid(passInput, true); valid = false;
    }
    if (password !== confirmar) {
      hint('confirmar', 'Las contraseñas no coinciden'); markInvalid(confirmInput, true); valid = false;
    }

    if (!valid) return;

    btnSubmit.disabled = true;
    btnSubmit.classList.add('loading');

    try {
      const fd = new FormData();
      fd.append('correo', correo);
      fd.append('password', password);

      const res  = await fetch('registro.php', { method: 'POST', body: fd });
      const data = await res.json();

      if (data.status === 'success') {
        showAlert('success', data.message || '¡Cuenta creada exitosamente!');
        setTimeout(() => window.location.href = 'login.html', 1800);
      } else {
        showAlert('error', data.message || 'Ocurrió un error. Intenta de nuevo.');
      }
    } catch {
      showAlert('error', 'No se pudo conectar con el servidor.');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.classList.remove('loading');
    }
  });