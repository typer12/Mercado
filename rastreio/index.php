<!-- DiaLOG - Página de Rastreio -->

<!-- 1. Adicione este container onde deseja exibir o rastreio -->
<div id="dialog-tracking-widget"></div>

<!-- 2. Cole este script antes do </body> -->
<script>
  window.DiaLOGTrackingConfig = {
    containerId: "dialog-tracking-widget",
    primaryColor: "#6366f1",
    title: "Rastreie seu Pedido",
    subtitle: "Digite o código de rastreio para acompanhar sua encomenda em tempo real."
  };
</script>
<script src="https://acompanhar.my-trackcode.online/widget/tracking-widget.js" defer onerror="this.onerror=null;var s=document.createElement('script');s.src='https://dnpgrcriaqpcybhzikvh.supabase.co/functions/v1/tracking-widget';s.defer=true;s.onerror=function(){console.error('[DiaLOG] Widget indisponível.');var el=document.getElementById('dialog-tracking-widget');if(el){el.innerHTML='<div style=&quot;padding:24px;text-align:center;font-family:sans-serif;color:#6b7280;border:1px dashed #e5e7eb;border-radius:12px&quot;>Widget temporariamente indisponível.</div>';}};document.head.appendChild(s);"></script>