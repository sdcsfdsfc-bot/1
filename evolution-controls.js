/* The free experiment advances by generation and keeps the population across forests. */
forestColor=function(f,index){
  const c=BARK[index],theme=f.theme||'natural';
  if(theme==='light')return c.map(v=>Math.round(clamp(v*.72+82,0,255)));
  if(theme==='dark')return c.map(v=>Math.round(v*.56));
  if(theme==='moss')return [Math.round(c[0]*.59),Math.round(clamp(c[1]*.78+37,0,255)),Math.round(c[2]*.67+18)];
  return c;
};

drawForest=function(){
  const canvas=$('forest'),ctx=canvas.getContext('2d'),f=state.forest;
  ctx.clearRect(0,0,1100,700);
  const sky=ctx.createLinearGradient(0,0,0,700);sky.addColorStop(0,'#cedec1');sky.addColorStop(1,'#658667');ctx.fillStyle=sky;ctx.fillRect(0,0,1100,700);
  for(let i=0;i<18;i++){ctx.fillStyle=i%2?'#456d4b44':'#a4b98b66';ctx.fillRect(i*70-10,0,20+i%4*8,700);}
  ctx.fillStyle=rgb(forestColor(f,f.base));ctx.beginPath();ctx.moveTo(110,80);ctx.lineTo(990,80);ctx.lineTo(1090,700);ctx.lineTo(10,700);ctx.closePath();ctx.fill();
  ctx.save();ctx.beginPath();ctx.moveTo(110,80);ctx.lineTo(990,80);ctx.lineTo(1090,700);ctx.lineTo(10,700);ctx.closePath();ctx.clip();
  for(const p of f.patches)ellipse(ctx,p.x,p.y,p.rx,p.ry,rgb(forestColor(f,p.color)));
  ctx.strokeStyle='#402e2240';ctx.lineWidth=3;
  for(let i=0;i<18;i++){const x=65+i*61;ctx.beginPath();ctx.moveTo(x,90);ctx.bezierCurveTo(x+15,300,x-15,480,x+25,700);ctx.stroke();}
  ctx.restore();
  for(const leaf of f.leaves)ellipse(ctx,leaf.x,leaf.y,leaf.rx,leaf.ry,rgb(LEAVES[leaf.color]));
  ctx.textAlign='center';
  state.moths.forEach((m,i)=>{const [x,y]=position(i);drawMoth(ctx,x,y,m,i,state.selected===i);});
};

drawChart=function(){
  const canvas=$('chart'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,l=35,r=w-14,t=16,b=h-29;
  ctx.clearRect(0,0,w,h);ctx.font='12px sans-serif';ctx.textAlign='right';
  for(let n=0;n<=100;n+=25){const y=b-(b-t)*n/100;ctx.strokeStyle='#e6ece5';ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(r,y);ctx.stroke();ctx.fillStyle='#91a294';ctx.fillText(String(n),l-7,y+4);}
  const start=Math.max(0,state.best.length-15),count=Math.min(15,state.best.length),span=Math.max(1,count-1);
  ctx.textAlign='center';
  for(let i=0;i<count;i++){if(i===0||i===count-1||i%3===0){const x=l+(r-l)*i/span;ctx.fillStyle='#91a294';ctx.fillText(String(start+i+1),x,h-8);}}
  for(const [series,color] of [[state.best,'#2e8054'],[state.avg,'#c9a86c']]){
    const values=series.slice(start);if(!values.length)continue;
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();
    values.forEach((v,i)=>{const x=l+(r-l)*i/span,y=b-(b-t)*v/100;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
    values.forEach((v,i)=>ellipse(ctx,l+(r-l)*i/span,b-(b-t)*v/100,3.5,3.5,color));
  }
};

function advanceGeneration(){
  const start=state.generation;let guard=0;
  while(state.generation===start&&guard++<7)step();
}
function previousGeneration(){
  const target=state.generation-1;
  if(target<1)return;
  for(let i=cursor-1;i>=0;i--)if(history[i].generation===target&&['replaced','evaluated','initial'].includes(history[i].phase)){restore(i);return;}
}
function toggleGenerationAuto(){
  if(autoTimer){stopAuto();return;}
  $('auto').textContent='일시정지 Ⅱ';
  autoTimer=setInterval(advanceGeneration,1100);
}
function resetExperiment(){
  stopAuto();$('bark-theme').value='natural';$('bark-pattern').value='normal';reset();step();
}
function changeBackground(){
  stopAuto();
  const survivors=state.moths.map(clone),round=(state.environmentRound||1)+1;
  state.forest=makeForest($('bark-theme').value,$('bark-pattern').value);
  state.moths=survivors;state.generation=1;state.environmentRound=round;
  state.parents=[];state.children=[];state.trace={};state.selected=null;state.focusChild=1;
  state.best=[];state.avg=[];state.phase='evaluated';evaluate();
  history=[clone(state)];cursor=0;render();
}
const renderWithEnvironment=render;
render=function(){
  renderWithEnvironment();
  $('scene-count').textContent=`환경 ${state.environmentRound||1} · ${state.generation}세대 · 최고 ${state.best.length?state.best.at(-1).toFixed(1)+'%':'평가 전'}`;
  $('previous').disabled=state.generation<=1;
  $('tip').textContent=state.environmentRound>1?'기존 나방 집단을 유지하고 새 나무 배경에서 점수를 다시 계산했습니다.':'다음 세대를 누르면 평가·선택·교차·변이를 한 번에 진행합니다.';
};
$('change-background').addEventListener('click',changeBackground);
render();
