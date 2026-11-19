/* The free experiment advances by generation and keeps the population across forests. */
forestColor=function(f,index){
  const c=BARK[index],theme=f.theme||'natural';
  if(theme==='light')return c.map(v=>Math.round(clamp(v*.72+82,0,255)));
  if(theme==='dark')return c.map(v=>Math.round(v*.56));
  if(theme==='moss')return [Math.round(c[0]*.59),Math.round(clamp(c[1]*.78+37,0,255)),Math.round(c[2]*.67+18)];
  return c;
};
const makeBaseForest=makeForest;
makeForest=function(theme='natural',pattern='normal'){
  const forest=makeBaseForest(theme,pattern);
  forest.genes=makeForestGenome(theme,pattern).genes;
  forest.patches=[];
  return forest;
};
treeColor=function(x,y){
  const f=state.forest;
  return f.genes?forestPatternColor(f,x,y):forestColor(f,f.base);
};
const FOREST_TEXTURES=new WeakMap();
function forestTexture(f){
  if(FOREST_TEXTURES.has(f))return FOREST_TEXTURES.get(f);
  const canvas=document.createElement('canvas');canvas.width=220;canvas.height=140;
  const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(220,140),colors=geneColors(f);
  for(let y=0;y<140;y++)for(let x=0;x<220;x++){
    const c=patternColor(f,x/220*3,y/140*2.5,colors),i=(y*220+x)*4;
    pixels.data[i]=c[0];pixels.data[i+1]=c[1];pixels.data[i+2]=c[2];pixels.data[i+3]=255;
  }
  ctx.putImageData(pixels,0,0);FOREST_TEXTURES.set(f,canvas);return canvas;
}

drawForest=function(){
  const canvas=$('forest'),ctx=canvas.getContext('2d'),f=state.forest;
  ctx.clearRect(0,0,1100,700);
  const sky=ctx.createLinearGradient(0,0,0,700);sky.addColorStop(0,'#cedec1');sky.addColorStop(1,'#658667');ctx.fillStyle=sky;ctx.fillRect(0,0,1100,700);
  for(let i=0;i<18;i++){ctx.fillStyle=i%2?'#456d4b44':'#a4b98b66';ctx.fillRect(i*70-10,0,20+i%4*8,700);}
  ctx.fillStyle=rgb(forestColor(f,f.base));ctx.beginPath();ctx.moveTo(110,80);ctx.lineTo(990,80);ctx.lineTo(1090,700);ctx.lineTo(10,700);ctx.closePath();ctx.fill();
  ctx.save();ctx.beginPath();ctx.moveTo(110,80);ctx.lineTo(990,80);ctx.lineTo(1090,700);ctx.lineTo(10,700);ctx.closePath();ctx.clip();
  if(f.genes){ctx.imageSmoothingEnabled=false;ctx.drawImage(forestTexture(f),0,0,1100,700);}
  else for(const p of f.patches)ellipse(ctx,p.x,p.y,p.rx,p.ry,rgb(forestColor(f,p.color)));
  ctx.strokeStyle='#402e2240';ctx.lineWidth=3;
  for(let i=0;i<18;i++){const x=65+i*61;ctx.beginPath();ctx.moveTo(x,90);ctx.bezierCurveTo(x+15,300,x-15,480,x+25,700);ctx.stroke();}
  ctx.restore();
  for(const leaf of f.leaves)ellipse(ctx,leaf.x,leaf.y,leaf.rx,leaf.ry,rgb(LEAVES[leaf.color]));
  ctx.textAlign='center';
  state.moths.forEach((m,i)=>{const [x,y]=position(i);drawMoth(ctx,x,y,m,i,state.selected===i);});
};

drawChart=function(){
  const canvas=$('chart'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,l=55,r=w-22,t=24,b=h-42;
  ctx.clearRect(0,0,w,h);ctx.font='12px sans-serif';
  const count=state.best.length;
  if(!count){$('chart-summary').textContent='첫 세대를 평가하면 변화가 기록됩니다.';$('chart-scale').textContent='전체 세대 · 점수 범위';$('chart-exploration').textContent='점수가 정체되면 변이와 새로운 후보로 다른 무늬를 탐색합니다.';return;}
  const values=[...state.best,...state.avg],minimum=Math.min(...values),maximum=Math.max(...values),padding=Math.max(5,(maximum-minimum)*.16);
  let lower=Math.max(0,Math.floor((minimum-padding)/5)*5),upper=Math.min(100,Math.ceil((maximum+padding)/5)*5);
  if(upper-lower<10){lower=Math.max(0,lower-5);upper=Math.min(100,upper+5);}
  const xAt=i=>l+(r-l)*i/Math.max(1,count-1),yAt=value=>b-(b-t)*(value-lower)/(upper-lower);
  ctx.textAlign='right';
  for(let i=0;i<=4;i++){
    const value=lower+(upper-lower)*i/4,y=yAt(value);
    ctx.strokeStyle='#e4ebe2';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(r,y);ctx.stroke();
    ctx.fillStyle='#758a79';ctx.fillText(`${value.toFixed(value%1?1:0)}%`,l-9,y+4);
  }
  const labelCount=Math.min(8,count),labels=new Set();
  for(let i=0;i<labelCount;i++)labels.add(Math.round(i*(count-1)/Math.max(1,labelCount-1)));
  ctx.textAlign='center';
  for(const i of labels){const x=xAt(i);ctx.fillStyle='#758a79';ctx.fillText(String(i+1),x,h-16);}
  for(const [series,color] of [[state.avg,'#c9a86c'],[state.best,'#2e8054']]){
    ctx.strokeStyle=color;ctx.lineWidth=3;ctx.lineJoin='round';ctx.beginPath();
    series.forEach((value,i)=>{const x=xAt(i),y=yAt(value);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
    if(count<=65)series.forEach((value,i)=>ellipse(ctx,xAt(i),yAt(value),3.3,3.3,color));
  }
  const initial=state.best[0],latest=state.best.at(-1),gain=latest-initial,stalled=stalledGenerations(state.best),baseRate=Number($('rate').value)/100;
  $('chart-summary').textContent=`${count}세대 전체 기록 · 첫 최고 ${initial.toFixed(1)}% → 현재 최고 ${latest.toFixed(1)}% · 변화 ${gain>=0?'+':''}${gain.toFixed(1)}%p`;
  $('chart-scale').textContent=`세로축 ${lower}~${upper}%로 확대 · 가로축은 세대`;
  if(stalled>=4&&baseRate>0){
    const rate=Math.min(.5,baseRate+Math.min(.16,.04*Math.floor(stalled/4)));
    const newcomers=stalled>=6?Math.min(4,1+Math.floor((stalled-6)/5)):0;
    $('chart-exploration').textContent=`최고 점수 ${stalled}세대 정체 · 다음 세대 변이 ${Math.round(rate*100)}%${newcomers?` · 새 후보 ${newcomers}마리 투입`:''}`;
  }else $('chart-exploration').textContent=stalled?`최고 점수 ${stalled}세대 유지 · 최고 나방은 보존합니다.`:'최고 점수가 새로 개선됐습니다.';
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
$('rate').addEventListener('input',drawChart);
reset();
