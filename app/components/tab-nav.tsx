'use client'

export function TabNavInit() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `
      (function(){
        var btns = document.querySelectorAll('.tabBtn');
        var panels = document.querySelectorAll('.tabPanel');
        function show(tab) {
          btns.forEach(function(b){ b.classList.toggle('active', b.dataset.tab===tab) });
          panels.forEach(function(p){ p.style.display = p.dataset.tab===tab ? '' : 'none' });
        }
        btns.forEach(function(b){
          b.addEventListener('click', function(e){
            e.preventDefault();
            var tab = b.dataset.tab;
            show(tab);
            history.replaceState(null,'','#'+tab);
          });
        });
        var hash = location.hash.slice(1);
        if(hash) show(hash);
      })()
    `}} />
  )
}
