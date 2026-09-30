(() => {
  const dialog=document.querySelector('.id-lightbox');
  const photos=[...document.querySelectorAll('.id-photo')];
  if(!dialog||!photos.length)return;
  let current=0,opener=null;
  const stage=dialog.querySelector('.id-lightbox-image');
  const caption=dialog.querySelector('p');
  const show=i=>{
    current=(i+photos.length)%photos.length;
    const source=photos[current].querySelector('img');
    const image=new Image();image.src=source.currentSrc||source.src;image.alt=source.alt;
    stage.replaceChildren(image);
    caption.textContent=`${current+1} / ${photos.length} · ${photos[current].dataset.caption}`;
  };
  photos.forEach((button,i)=>button.addEventListener('click',()=>{opener=button;show(i);dialog.showModal();document.documentElement.style.overflow='hidden';}));
  dialog.querySelector('.id-lightbox-close').addEventListener('click',()=>dialog.close());
  dialog.querySelector('.id-lightbox-prev').addEventListener('click',()=>show(current-1));
  dialog.querySelector('.id-lightbox-next').addEventListener('click',()=>show(current+1));
  dialog.addEventListener('keydown',event=>{if(event.key==='ArrowRight'){event.preventDefault();show(current+1);}if(event.key==='ArrowLeft'){event.preventDefault();show(current-1);}});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{document.documentElement.style.overflow='';opener?.focus();});
})();
