let offlineReady = false, setupFailed = false, workerRegistration, installPrompt;
const connectionStatus = document.querySelector('#connection-status');
const offlineHelp = document.querySelector('#offline-help');
const panel = document.querySelector('.offline-panel');
function showConnection(error = setupFailed) {
  setupFailed = error;
  panel.dataset.state = error ? 'error' : navigator.onLine ? 'online' : 'offline';
  connectionStatus.textContent = error ? 'Uso offline ainda não disponível' : offlineReady ? (navigator.onLine ? 'Pronto para usar offline' : 'Sem conexão • coleta disponível') : 'Preparando uso offline…';
  offlineHelp.textContent = error ? 'Conecte-se à internet e toque em Tentar novamente. Os questionários salvos continuam neste dispositivo.' : offlineReady ? 'Questionários e respostas ficam neste dispositivo. Você pode fechar e reabrir o app sem internet.' : 'Mantenha o app aberto com internet até aparecer “Pronto para usar offline”.';
  document.querySelector('#retry-offline').hidden = !error;
}
async function prepareOffline() {
  if (!('serviceWorker' in navigator)) { showConnection(true); return; }
  try {
    workerRegistration = await navigator.serviceWorker.register('./sw.js', {updateViaCache:'none'});
    const watch = worker => {
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') {
          if (navigator.serviceWorker.controller) document.querySelector('#update-app').hidden = false;
        }
        if (worker.state === 'redundant' && !offlineReady) showConnection(true);
      });
    };
    if (workerRegistration.installing) watch(workerRegistration.installing);
    workerRegistration.addEventListener('updatefound', () => watch(workerRegistration.installing));
    if (workerRegistration.waiting) document.querySelector('#update-app').hidden = false;
    await navigator.serviceWorker.ready;
    offlineReady = true;
    showConnection();
  } catch { showConnection(true); }
}
document.querySelector('#retry-offline').onclick = () => {showConnection(false);prepareOffline()};
document.querySelector('#update-app').onclick = () => {
  if (editing && !checkpoint()) {notify('Salve ou exporte a coleta antes de atualizar.');return;}
  if (workerRegistration?.waiting) {
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), {once:true});
    workerRegistration.waiting.postMessage({type:'ACTIVATE_UPDATE'});
  }
};
window.addEventListener('online', () => showConnection());
window.addEventListener('offline', () => showConnection());
window.addEventListener('beforeinstallprompt', event => {event.preventDefault();installPrompt=event;document.querySelector('#install-app').hidden=false});
document.querySelector('#install-app').onclick = async () => {if(installPrompt){await installPrompt.prompt();installPrompt=null;document.querySelector('#install-app').hidden=true}};
window.addEventListener('appinstalled', () => {document.querySelector('#install-app').hidden=true});
prepareOffline();
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
