/* HELU · cliente da aba de equipe (JS puro, sem dependências).
   window.HeluEquipe = { login, sair, logado, catalogo, salvar, foto, trocarSenha, redimensionar }
   Todas as chamadas vão para /api/equipe. */
(function () {
  var BASE = '/api/equipe', CH = 'helu_equipe_token';
  var rev = 0;
  function tok() { try { return sessionStorage.getItem(CH) || ''; } catch (e) { return ''; } }
  function guardar(t) { try { t ? sessionStorage.setItem(CH, t) : sessionStorage.removeItem(CH); } catch (e) {} }
  function chamar(a, opt) {
    opt = opt || {};
    var h = opt.headers || {};
    if (opt.auth && tok()) h.Authorization = 'Bearer ' + tok();
    return fetch(BASE + '?a=' + a, { method: opt.method || 'GET', headers: h, body: opt.body, cache: 'no-store' }).then(function (r) {
      return r.text().then(function (t) {
        var d = null; try { d = JSON.parse(t); } catch (e) {}
        if (!r.ok || !d || d.ok === false) {
          var er = new Error((d && d.erro) || ('Falha (' + r.status + ')')); er.status = r.status; er.conflito = !!(d && d.conflito); throw er;
        }
        return d;
      });
    });
  }
  window.HeluEquipe = {
    logado: function () { return !!tok(); },
    login: function (senha) {
      return chamar('login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ senha: senha }) })
        .then(function (d) { guardar(d.token); return true; });
    },
    sair: function () { guardar(''); },
    /* devolve o catálogo salvo (ou null se nunca foi salvo) e guarda a revisão */
    catalogo: function () {
      return chamar('catalogo').then(function (d) { rev = d.rev || 0; return d.data; });
    },
    salvar: function (data) {
      return chamar('catalogo', { method: 'PUT', auth: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: data, rev: rev }) })
        .then(function (d) { rev = d.rev; return d; })
        .catch(function (e) { if (e.status === 401) guardar(''); throw e; });
    },
    foto: function (blob) {
      return chamar('foto', { method: 'POST', auth: true, headers: { 'content-type': blob.type || 'image/jpeg' }, body: blob })
        .then(function (d) { return d.url; })
        .catch(function (e) { if (e.status === 401) guardar(''); throw e; });
    },
    trocarSenha: function (nova) {
      return chamar('senha', { method: 'POST', auth: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nova: nova }) })
        .then(function (d) { guardar(d.token); return true; });
    },
    /* reduz a foto do celular (até 1600 px, JPEG) antes de enviar */
    redimensionar: function (file, max) {
      max = max || 1600;
      return new Promise(function (ok, no) {
        var img = new Image(), u = URL.createObjectURL(file);
        img.onload = function () {
          var k = Math.min(1, max / Math.max(img.width, img.height));
          var c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(u);
          c.toBlob(function (b) { b ? ok(b) : no(new Error('Não consegui preparar a foto.')); }, 'image/jpeg', 0.85);
        };
        img.onerror = function () { URL.revokeObjectURL(u); no(new Error('Não consegui abrir essa foto.')); };
        img.src = u;
      });
    }
  };
})();
