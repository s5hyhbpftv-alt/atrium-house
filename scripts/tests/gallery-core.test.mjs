import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context = {window:{},setTimeout,clearTimeout,Date,Image:class {}};
vm.runInNewContext(readFileSync(new URL('../../sheerwood-site/assets/gallery-core.js',import.meta.url),'utf8'),context);
const {swipe,ready}=context.window.SheerwoodGallery;
class Surface extends EventTarget {clientWidth=390;}
const point=(x,y,id=1)=>({identifier:id,clientX:x,clientY:y});
function touch(surface,type,points){const event=new Event(type,{cancelable:true});Object.assign(event,{touches:type==='touchend'?[]:points,changedTouches:points});surface.dispatchEvent(event);return event;}
function gesture(surface,from,to){touch(surface,'touchstart',[point(...from)]);touch(surface,'touchmove',[point(...to)]);touch(surface,'touchend',[point(...to)]);}
test('fullscreen and stage swipes support both directions and suppress the trailing zoom/open click',()=>{
 const surface=new Surface(),moves=[];swipe(surface,d=>moves.push(d));
 gesture(surface,[300,150],[80,165]);gesture(surface,[80,160],[300,155]);assert.deepEqual(moves,[1,-1]);
 const click=new Event('click',{cancelable:true});surface.dispatchEvent(click);assert.equal(click.defaultPrevented,true);
});
test('vertical scrolling and short taps never switch photos',()=>{
 const surface=new Surface(),moves=[];swipe(surface,d=>moves.push(d));
 touch(surface,'touchstart',[point(200,100)]);const move=touch(surface,'touchmove',[point(180,250)]);touch(surface,'touchend',[point(170,300)]);
 gesture(surface,[200,100],[215,102]);assert.deepEqual(moves,[]);assert.equal(move.defaultPrevented,false);
});
test('pinch, cancellation and zoomed-image panning do not advance',()=>{
 const surface=new Surface(),moves=[];let enabled=true;swipe(surface,d=>moves.push(d),()=>enabled);
 touch(surface,'touchstart',[point(300,100)]);touch(surface,'touchmove',[point(250,100),point(350,100,2)]);touch(surface,'touchend',[point(60,100)]);
 touch(surface,'touchstart',[point(300,100)]);touch(surface,'touchcancel',[]);touch(surface,'touchend',[point(50,100)]);
 enabled=false;gesture(surface,[300,100],[50,100]);assert.deepEqual(moves,[]);
 enabled=true;gesture(surface,[300,100],[50,100]);assert.deepEqual(moves,[1]);
});
test('horizontal movement claims the gesture while preserving vertical scroll',()=>{
 const surface=new Surface();swipe(surface,()=>{});touch(surface,'touchstart',[point(300,100)]);
 assert.equal(touch(surface,'touchmove',[point(200,105)]).defaultPrevented,true);
});
test('decode has a deadline so a stalled request cannot lock navigation forever',async()=>{
 const img=new EventTarget();img.decode=()=>new Promise(()=>{});
 await assert.rejects(ready(img,8),/timed out/);
});
test('decoded and fallback-loaded images become ready, broken files report errors',async()=>{
 const img=new EventTarget();img.naturalWidth=1600;img.decode=()=>Promise.resolve();assert.equal(await ready(img,100),img);
 const fallback=new EventTarget();fallback.naturalWidth=1600;fallback.complete=true;assert.equal(await ready(fallback,100),fallback);
 const broken=new EventTarget();broken.complete=true;broken.naturalWidth=0;broken.decode=()=>Promise.reject(new Error('decode'));await assert.rejects(ready(broken,100),/Empty image/);
});
