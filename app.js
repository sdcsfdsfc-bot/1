const POP_SIZE = 12;
const MAX_GENERATIONS = 10;
const PALETTE = [[42,103,65],[80,130,74],[130,161,83],[177,151,92],[104,75,55],[70,119,132],[180,111,73],[196,184,141],[119,91,143],[218,119,145],[45,81,120],[160,96,126],[211,167,94],[105,109,108],[230,210,174]];
const BARK = [[76,43,29],[94,54,35],[111,65,42],[128,76,49],[145,88,57],[158,101,67],[126,80,58],[171,116,79],[102,70,52],[190,137,94]];
const LEAVES = [[43,105,55],[57,127,62],[75,145,68],[91,157,78]];
const LESSONS = [
  ['무작위 개체군','나방마다 조금씩 다른 날개 색과 반점 수를 가지고 시작합니다.','12마리의 나방에게 날개 색 유전자 3개와 반점 수 유전자 1개를 무작위로 배정합니다.'],
  ['적합도 평가','나무껍질과 더 비슷한 나방이 높은 점수를 받습니다.','날개 부분의 색과 배경 색 차이를 여러 지점에서 비교합니다. 차이가 작을수록 위장 점수가 높아집니다.'],
  ['부모 선택','점수가 높은 나방일수록 부모가 될 가능성이 커집니다.','룰렛 휠 선택을 사용합니다. 점수가 낮은 나방도 선택될 가능성이 조금은 남아 있습니다.'],
  ['유전자 교차','두 부모의 유전자를 섞어 다음 세대의 나방을 만듭니다.','각 색 유전자를 부모 중 한쪽에서 무작위로 받고, 가장 좋은 나방 한 마리는 그대로 보존합니다.'],
  ['돌연변이','일부 유전자가 낮은 확률로 바뀌어 다양성을 만듭니다.','슬라이더로 변이 확률을 조절하세요. 확률을 높이면 더 다양한 색이 나타납니다.'],
  ['세대 교체','새 개체군을 다시 평가하며 10세대까지 반복합니다.','최고 점수와 평균 점수의 흐름을 그래프에서 살펴보세요. 결과는 매번 달라질 수 있습니다.']
];
const PHASES = {
  initial:['초기 개체군','12마리의 나방이 무작위 유전자를 가지고 태어났습니다.','나방의 색과 나무껍질의 색을 비교해 보세요.'],
  evaluated:['적합도 평가','날개 색과 배경 색을 비교해 각 나방의 위장 점수를 계산했습니다.','점수가 높은 나방은 나무껍질에 더 잘 섞입니다.'],
  selected:['부모 선택','위장 점수를 가중치로 사용해 부모 두 마리를 뽑았습니다.','선택된 부모에게는 밝은 테두리가 표시됩니다.'],
  crossed:['유전자 교차','두 부모의 유전자를 섞어 자손 12마리를 만들었습니다.','가장 좋은 나방 한 마리는 그대로 다음 세대로 옮깁니다.'],
  mutated:['돌연변이','일부 자손의 유전자가 설정한 확률에 따라 바뀌었습니다.','변이는 새로운 가능성을 만들지만 항상 점수를 높이지는 않습니다.'],
  replaced:['세대 교체','자손이 새로운 개체군이 되었습니다. 다시 평가를 시작합니다.','그래프에서 세대별 최고 점수와 평균 점수를 비교해 보세요.'],
  finished:['실험 완료','10세대까지 진행했습니다. 그래프와 나방의 색 변화를 살펴보세요.','새로운 숲을 누르면 다른 환경에서 다시 실험할 수 있습니다.']
};
const $ = id => document.getElementById(id);
const rnd = n => Math.floor(Math.random()*n);
const rgb = a => `rgb(${a.join(',')})`;
const clone = x => JSON.parse(JSON.stringify(x));
let state, history=[], cursor=0, autoTimer=null;

function moth(){return {colors:[rnd(PALETTE.length),rnd(PALETTE.length),rnd(PALETTE.length)],spots:2+rnd(5),score:null,mutations:[]};}
function position(i){return [155+(i%6)*158,195+Math.floor(i/6)*195];}
function makeForest(){const patches=[],leaves=[];for(let i=0;i<180;i++){const x=95+Math.random()*910,y=125+Math.random()*540,rx=15+rnd(38),ry=12+rnd(27);const left=110-(y-80)*100/620,right=990+(y-80)*100/620;if(x>left+rx+10&&x<right-rx-10)patches.push({x,y,rx,ry,color:rnd(BARK.length)});}for(let i=0;i<38;i++){const x=35+rnd(1031),y=-55+rnd(281),rx=18+rnd(38),ry=15+rnd(24);if(((x-550)/515)**2+((y-70)/165)**2<=1)leaves.push({x,y,rx,ry,color:rnd(LEAVES.length)});}return {base:rnd(BARK.length),patches,leaves};}
function treeColor(x,y){for(let i=state.forest.patches.length-1;i>=0;i--){const p=state.forest.patches[i];if(((x-p.x)/p.rx)**2+((y-p.y)/p.ry)**2<=1)return BARK[p.color];}return BARK[state.forest.base];}
function colorError(m,i){const [cx,cy]=position(i);let total=0,count=0;for(const side of [-1,1])for(let px=0;px<54;px+=3)for(let py=0;py<36;py+=3){if(py>36*(1-px/54)+7)continue;const bg=treeColor(cx+side*(7+px*.72),cy-5+py*.72),fg=PALETTE[m.colors[Math.floor(px/9)%3]];total+=Math.abs(bg[0]-fg[0])+Math.abs(bg[1]-fg[1])+Math.abs(bg[2]-fg[2]);count+=3;}return total/Math.max(count,1);}
function evaluate(){state.moths.forEach((m,i)=>{let score=99.9/(1+Math.exp((colorError(m,i)-65)/8));m.score=state.generation===1?Math.min(score,70):score;});state.best.push(Math.max(...state.moths.map(m=>m.score)));state.avg.push(state.moths.reduce((a,m)=>a+m.score,0)/POP_SIZE);}
function selectParent(){const weights=state.moths.map(m=>(m.score||0)+1),total=weights.reduce((a,b)=>a+b,0);let r=Math.random()*total;for(let i=0;i<weights.length;i++){r-=weights[i];if(r<=0)return i;}return weights.length-1;}
function stopAuto(){if(autoTimer){clearInterval(autoTimer);autoTimer=null;}$('auto').textContent='자동 진행 ▷';$('detail-auto').textContent='자동 진행 ▷';}
function reset(){stopAuto();state={forest:makeForest(),generation:1,phase:'initial',moths:Array.from({length:POP_SIZE},moth),parents:[],children:[],best:[],avg:[],selected:null,trace:{},focusChild:1};history=[clone(state)];cursor=0;render();}
function save(){history=history.slice(0,cursor+1);history.push(clone(state));cursor=history.length-1;render();}
function restore(i){if(i<0||i>=history.length)return;state=clone(history[i]);cursor=i;render();}
function step(){
  if(cursor<history.length-1){restore(cursor+1);return;}
  switch(state.phase){
    case 'initial': evaluate();state.phase='evaluated';break;
    case 'evaluated':case 'replaced':
      state.parents=[selectParent(),selectParent()];
      state.trace={parentWeights:state.moths.map(m=>m.score+1),parentMoths:state.parents.map(i=>clone(state.moths[i]))};
      state.phase='selected';break;
    case 'selected':{
      const [a,b]=state.parents.map(i=>state.moths[i]);
      const eliteIndex=state.moths.findIndex(m=>m.score===Math.max(...state.moths.map(x=>x.score)));
      state.children=[clone(state.moths[eliteIndex])];state.children[0].mutations=[];
      state.trace.eliteIndex=eliteIndex;state.trace.crossSources=[['보존','보존','보존','보존']];
      for(let i=1;i<POP_SIZE;i++){
        const sources=[0,1,2].map(()=>rnd(2));const spotSource=rnd(2);
        state.children.push({colors:sources.map((s,j)=>(s===0?a:b).colors[j]),spots:(spotSource===0?a:b).spots,score:null,mutations:[]});
        state.trace.crossSources.push([...sources,spotSource]);
      }
      state.phase='crossed';break;
    }
    case 'crossed':{
      const rate=Number($('rate').value)/100;
      state.trace.beforeMutation=clone(state.children);state.trace.mutationRate=rate;
      for(const child of state.children.slice(1)){
        for(let j=0;j<3;j++)if(Math.random()<rate){child.colors[j]=rnd(PALETTE.length);child.mutations.push(j);}
        if(Math.random()<rate){child.spots=2+rnd(5);child.mutations.push(3);}
      }
      state.phase='mutated';break;
    }
    case 'mutated':
      state.trace.previousBest=state.best[state.best.length-1];
      state.moths=state.children;state.children=[];state.parents=[];state.generation++;
      evaluate();state.phase=state.generation>=MAX_GENERATIONS?'finished':'replaced';
      if(state.phase==='finished')stopAuto();break;
    default:stopAuto();return;
  }
  save();
}
function ellipse(ctx,x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function drawMoth(ctx,x,y,m,i,selected,scale=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.shadowColor='#1e1a1588';ctx.shadowBlur=9;ctx.shadowOffsetY=5;for(const side of [-1,1]){ctx.save();ctx.scale(side,1);ctx.beginPath();ctx.moveTo(3,-18);ctx.bezierCurveTo(25,-48,72,-29,65,4);ctx.bezierCurveTo(77,26,45,41,7,21);ctx.closePath();ctx.fillStyle=rgb(PALETTE[m.colors[0]]);ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#273f3199';ctx.stroke();ctx.shadowColor='transparent';ctx.beginPath();ctx.moveTo(17,-18);ctx.bezierCurveTo(45,-29,65,-11,61,8);ctx.bezierCurveTo(56,19,35,22,14,13);ctx.closePath();ctx.fillStyle=rgb(PALETTE[m.colors[1]]);ctx.fill();ctx.beginPath();ctx.moveTo(24,9);ctx.bezierCurveTo(48,6,60,18,48,29);ctx.bezierCurveTo(32,30,18,25,13,18);ctx.closePath();ctx.fillStyle=rgb(PALETTE[m.colors[2]]);ctx.fill();for(let s=0;s<m.spots;s++)ellipse(ctx,27+(s%3)*12,-11+Math.floor(s/3)*18,3,3,'#f8eec9aa');ctx.restore();}ctx.shadowColor='transparent';ellipse(ctx,0,3,7,28,'#ece7cc');ctx.strokeStyle='#d8d3b7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-3,-20);ctx.lineTo(-14,-38);ctx.moveTo(3,-20);ctx.lineTo(14,-38);ctx.stroke();if(selected){ctx.strokeStyle='#fff8b8';ctx.lineWidth=4;ctx.setLineDash([5,4]);ctx.beginPath();ctx.ellipse(0,0,80,51,0,0,Math.PI*2);ctx.stroke();}ctx.restore();if(m.score!==null){ctx.fillStyle='#173b32dd';ctx.beginPath();ctx.roundRect(x-30*scale,y+44*scale,60*scale,24*scale,8*scale);ctx.fill();ctx.fillStyle='white';ctx.font=`700 ${12*scale}px sans-serif`;ctx.textAlign='center';ctx.fillText(`${m.score.toFixed(1)}%`,x,y+60*scale);}else{ctx.fillStyle='#fffdf1dd';ctx.beginPath();ctx.roundRect(x-22*scale,y+44*scale,44*scale,22*scale,8*scale);ctx.fill();ctx.fillStyle='#31573e';ctx.font=`700 ${11*scale}px sans-serif`;ctx.textAlign='center';ctx.fillText(String(i+1).padStart(2,'0'),x,y+59*scale);}}
function drawForest(){const c=$('forest'),ctx=c.getContext('2d'),f=state.forest;ctx.clearRect(0,0,1100,700);const sky=ctx.createLinearGradient(0,0,0,700);sky.addColorStop(0,'#cedec1');sky.addColorStop(1,'#658667');ctx.fillStyle=sky;ctx.fillRect(0,0,1100,700);for(let i=0;i<18;i++){ctx.fillStyle=i%2?'#456d4b44':'#a4b98b66';ctx.fillRect(i*70-10,0,20+i%4*8,700);}ctx.fillStyle=rgb(BARK[f.base]);ctx.beginPath();ctx.moveTo(110,80);ctx.lineTo(990,80);ctx.lineTo(1090,700);ctx.lineTo(10,700);ctx.closePath();ctx.fill();ctx.save();ctx.beginPath();ctx.moveTo(110,80);ctx.lineTo(990,80);ctx.lineTo(1090,700);ctx.lineTo(10,700);ctx.closePath();ctx.clip();for(const p of f.patches)ellipse(ctx,p.x,p.y,p.rx,p.ry,rgb(BARK[p.color]));ctx.strokeStyle='#402e2240';ctx.lineWidth=3;for(let i=0;i<18;i++){let x=65+i*61;ctx.beginPath();ctx.moveTo(x,90);ctx.bezierCurveTo(x+15,300,x-15,480,x+25,700);ctx.stroke();}ctx.restore();for(const leaf of f.leaves)ellipse(ctx,leaf.x,leaf.y,leaf.rx,leaf.ry,rgb(LEAVES[leaf.color]));ctx.textAlign='center';state.moths.forEach((m,i)=>{const [x,y]=position(i);drawMoth(ctx,x,y,m,i,state.selected===i||state.phase==='selected'&&state.parents.includes(i));});}
function drawChart(){const c=$('chart'),ctx=c.getContext('2d'),w=c.width,h=c.height,l=34,r=w-14,t=16,b=h-30;ctx.clearRect(0,0,w,h);ctx.font='12px sans-serif';ctx.textAlign='right';for(let n=0;n<=100;n+=25){const y=b-(b-t)*n/100;ctx.strokeStyle='#e6ece5';ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(r,y);ctx.stroke();ctx.fillStyle='#91a294';ctx.fillText(`${n}`,l-7,y+4);}ctx.textAlign='center';for(let i=1;i<=10;i++){const x=l+(r-l)*(i-1)/9;ctx.fillStyle='#91a294';ctx.fillText(String(i),x,h-8);}for(const [data,color] of [[state.best,'#2e8054'],[state.avg,'#c9a86c']]){if(!data.length)continue;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();data.forEach((v,i)=>{const x=l+(r-l)*i/9,y=b-(b-t)*v/100;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();data.forEach((v,i)=>{ellipse(ctx,l+(r-l)*i/9,b-(b-t)*v/100,4,4,color);});}}
function render(){const p=PHASES[state.phase];$('generation').innerHTML=`${String(state.generation).padStart(2,'0')} <small>/ 10</small>`;$('phase-title').textContent=p[0];$('phase-description').textContent=p[1];$('tip').textContent=p[2];$('previous').disabled=cursor===0;$('next').disabled=state.phase==='finished'&&cursor===history.length-1;$('scene-count').textContent=`장면 ${cursor+1} / ${history.length}`;$('scene-range').max=Math.max(0,history.length-1);$('scene-range').value=cursor;const stages=['평가','선택','교차','변이','교체'];const active={initial:-1,evaluated:0,selected:1,crossed:2,mutated:3,replaced:4,finished:4}[state.phase];$('stage-steps').innerHTML=stages.map((s,i)=>`<span class="${i===active?'current':''}">${s}</span>`).join('');if(state.selected===null){$('moth-heading').textContent='나방을 선택하세요';$('moth-info').textContent='나방을 누르면 날개 색 유전자와 위장 점수를 볼 수 있습니다.';$('genes').replaceChildren();}else{const m=state.moths[state.selected];$('moth-heading').textContent=`나방 ${String(state.selected+1).padStart(2,'0')}`;$('moth-info').textContent=`위장 점수 ${m.score===null?'평가 전':m.score.toFixed(1)+'%'} · 반점 ${m.spots}개`;$('genes').innerHTML=m.colors.map((v,i)=>`<div class="gene"><i class="swatch" style="background:${rgb(PALETTE[v])}"></i>날개 색 ${i+1}<strong>${rgb(PALETTE[v])}</strong></div>`).join('');}drawForest();drawChart();renderTrace();}
const traceOrder=['initial','evaluated','selected','crossed','mutated','replaced'];
const traceNames=['시작','평가','선택','교차','변이','교체'];
const geneNames=['날개 1','날개 2','날개 3','반점'];
function geneValue(m,j){return j===3?`${m.spots}개`:`#${PALETTE[m.colors[j]].map(v=>v.toString(16).padStart(2,'0')).join('')}`;}
function geneChip(m,j){return j===3?`<span class="trace-spot">${m.spots}개</span>`:`<i class="trace-swatch" style="background:${rgb(PALETTE[m.colors[j]])}"></i><code>${geneValue(m,j)}</code>`;}
function geneRows(m,source=null,before=null){return `<div class="trace-gene-list">${geneNames.map((name,j)=>`<div class="trace-gene-row"><span>${name}</span><div>${geneChip(m,j)}</div>${source?`<small>${source[j]}</small>`:''}${before?`<small class="${m.mutations.includes(j)?'changed':'same'}">${geneValue(before,j)} → ${geneValue(m,j)}</small>`:''}</div>`).join('')}</div>`;}
function focusMoth(i){return state.moths[i]||state.moths[0];}
function renderTrace(){
  const phase=state.phase,info=PHASES[phase],stage=phase==='finished'?5:traceOrder.indexOf(phase);
  $('trace-step-number').textContent=`STEP ${String(stage+1).padStart(2,'0')}`;
  $('trace-title').textContent=info[0];$('trace-description').textContent=info[1];
  $('trace-generation').textContent=`${String(state.generation).padStart(2,'0')} / 10`;
  $('detail-previous').disabled=cursor===0;
  $('detail-next').disabled=phase==='finished'&&cursor===history.length-1;
  $('detail-scene-count').textContent=`장면 ${cursor+1} / ${history.length}`;
  $('detail-scene-range').max=Math.max(0,history.length-1);
  $('detail-scene-range').value=cursor;
  $('trace-phases').innerHTML=traceNames.map((name,i)=>`<span class="${i===stage?'current':i<stage?'passed':''}"><b>${String(i+1).padStart(2,'0')}</b>${name}</span>`).join('');
  const bestIndex=state.moths.reduce((best,m,i)=>m.score!==null&&(best<0||m.score>state.moths[best].score)?i:best,-1);
  $('trace-best').textContent=bestIndex<0?'—':`${state.moths[bestIndex].score.toFixed(1)}%`;
  $('trace-best-caption').textContent=bestIndex<0?'아직 평가 전입니다':`${state.generation}세대 · 나방 ${bestIndex+1}번`;
  const picked=state.selected===null?(bestIndex<0?0:bestIndex):state.selected;
  $('trace-population').innerHTML=state.moths.map((m,i)=>`<button type="button" data-moth="${i}" class="trace-moth-option ${i===picked?'active':''} ${state.parents.includes(i)&&phase==='selected'?'parent':''}"><span>${String(i+1).padStart(2,'0')}</span><i style="background:${rgb(PALETTE[m.colors[0]])}"></i><strong>${m.score===null?'—':m.score.toFixed(1)+'%'}</strong></button>`).join('');
  const content=$('trace-content');
  if(phase==='initial'||phase==='evaluated'){
    const m=focusMoth(picked),error=colorError(m,picked),raw=99.9/(1+Math.exp((error-65)/8));
    content.innerHTML=`<div class="trace-observe"><canvas id="focus-canvas" width="500" height="250" aria-label="선택한 나방의 날개와 나무껍질"></canvas><div class="trace-observe-copy"><span class="trace-tag">SOLUTION ${String(picked+1).padStart(2,'0')}</span><h3>나방 ${picked+1}번의 유전자</h3><p>날개 색 3개가 하나의 후보 해를 이룹니다. 반점 수는 외형 유전자이며 현재 점수 계산에는 포함되지 않습니다.</p>${geneRows(m)}</div></div><div class="trace-math"><div><span>① 색 차이 측정</span><strong>${error.toFixed(2)}</strong><small>날개의 여러 지점에서 RGB 차이의 평균</small></div><div><span>② 점수로 변환</span><strong>${phase==='initial'?'평가 대기':m.score.toFixed(1)+'%'}</strong><small>99.9 ÷ (1 + e<sup>(차이 − 65) ÷ 8</sup>)${state.generation===1?' · 첫 세대는 70% 상한':''}</small></div></div><p class="trace-explain">${phase==='initial'?'다음 장면에서 12마리를 모두 평가합니다.':'색 차이가 작을수록 위장 점수가 높습니다. 오른쪽에서 다른 나방을 선택해 같은 계산을 비교해 보세요.'}</p>`;
    drawFocus(picked,m);
  }else if(phase==='selected'){
    const weights=state.trace.parentWeights,total=weights.reduce((a,b)=>a+b,0);
    const rows=state.moths.map((m,i)=>({i,score:m.score,prob:weights[i]/total})).sort((a,b)=>b.prob-a.prob);
    content.innerHTML=`<div class="trace-callout"><span class="trace-tag">ROULETTE SELECTION</span><h3>높은 점수일수록 부모가 될 확률이 커집니다.</h3><p>각 나방의 가중치는 <strong>점수 + 1</strong>입니다. 모든 가중치를 합친 뒤 각자의 비율만큼 추첨 구간을 배정합니다.</p><div class="trace-parent-pair"><span>부모 A <strong>나방 ${state.parents[0]+1}번</strong></span><span>부모 B <strong>나방 ${state.parents[1]+1}번</strong></span></div></div><div class="trace-table-wrap"><table class="trace-table"><thead><tr><th>나방</th><th>위장 점수</th><th>선택 확률</th><th>추첨 구간 비중</th></tr></thead><tbody>${rows.map(({i,score,prob})=>`<tr class="${state.parents.includes(i)?'chosen':''}"><td>${String(i+1).padStart(2,'0')}${state.parents.includes(i)?' ★':''}</td><td>${score.toFixed(1)}%</td><td>${(prob*100).toFixed(1)}%</td><td><span class="prob-track"><i style="width:${Math.max(3,prob*100*5)}%"></i></span></td></tr>`).join('')}</tbody></table></div><p class="trace-explain">같은 나방이 두 번 뽑힐 수도 있습니다. 점수가 낮아도 확률이 0은 아니므로 다양성이 남습니다.</p>`;
  }else if(phase==='crossed'||phase==='mutated'){
    const childIndex=Math.min(Math.max(state.focusChild,0),11),child=state.children[childIndex],before=state.trace.beforeMutation?.[childIndex],sources=state.trace.crossSources[childIndex];
    const parentA=state.trace.parentMoths[0],parentB=state.trace.parentMoths[1];
    content.innerHTML=`<div class="trace-callout"><span class="trace-tag">${phase==='crossed'?'CROSSOVER':'MUTATION'}</span><h3>${phase==='crossed'?'부모의 유전자를 하나씩 받아 새 해를 만듭니다.':'일부 유전자가 무작위로 바뀝니다.'}</h3><p>${phase==='crossed'?'맨 앞 자손은 이전 세대 최고 점수 나방을 그대로 보존합니다. 나머지 11마리는 두 부모의 유전자를 섞습니다.':`이번 변이 확률은 ${(state.trace.mutationRate*100).toFixed(0)}%입니다. 각 유전자마다 독립적으로 변이를 시도했습니다.`}</p></div><div class="trace-child-picker">${state.children.map((m,i)=>`<button type="button" data-child="${i}" class="${i===childIndex?'active':''}">${i===0?'★ 보존':`자손 ${i+1}`}${phase==='mutated'&&m.mutations.length?' <i>●</i>':''}</button>`).join('')}</div><div class="trace-compare"><div><span class="trace-tag">PARENT A · ${state.parents[0]+1}</span>${geneRows(parentA)}</div><div><span class="trace-tag">PARENT B · ${state.parents[1]+1}</span>${geneRows(parentB)}</div><div class="child-result"><span class="trace-tag">${childIndex===0?'ELITE · 그대로 보존':`CHILD · ${childIndex+1}`}</span>${geneRows(child,sources.map(s=>s==='보존'?'그대로 보존':`부모 ${s===0?'A':'B'}에서 받음`),phase==='mutated'&&before?before:null)}</div></div><p class="trace-explain">${phase==='crossed'?'자손을 눌러 유전자별로 어느 부모에게서 왔는지 비교해 보세요.':'노란색으로 표시된 행은 변이를 시도한 유전자입니다. 같은 색이 다시 뽑혀 값이 같을 수도 있습니다.'}</p>`;
  }else{
    const previous=state.trace.previousBest,current=state.best[state.best.length-1],delta=previous===undefined?0:current-previous;
    const ranked=state.moths.map((m,i)=>({m,i})).sort((a,b)=>b.m.score-a.m.score).slice(0,3);
    content.innerHTML=`<div class="trace-callout"><span class="trace-tag">${phase==='finished'?'FINAL RESULT':'NEXT GENERATION'}</span><h3>${phase==='finished'?'10세대의 탐색이 끝났습니다.':'새로운 12마리를 평가했습니다.'}</h3><p>이전 세대 최고 나방을 보존하고 새 자손을 평가합니다. 최고 점수가 유지되거나 높아지는지 확인해 보세요.</p></div><div class="trace-result"><div><span>이전 최고</span><strong>${previous===undefined?'—':previous.toFixed(1)+'%'}</strong></div><b>→</b><div><span>현재 최고</span><strong>${current.toFixed(1)}%</strong></div><div class="trace-delta"><span>변화</span><strong>${delta>=0?'+':''}${delta.toFixed(1)}%p</strong></div></div><h3 class="trace-subtitle">이번 세대의 상위 해</h3><div class="trace-top-three">${ranked.map(({m,i},rank)=>`<div><span>${rank+1}위 · 나방 ${i+1}</span><strong>${m.score.toFixed(1)}%</strong><div>${m.colors.map(v=>`<i style="background:${rgb(PALETTE[v])}"></i>`).join('')}</div></div>`).join('')}</div><p class="trace-explain">유전 알고리즘은 여러 후보 해를 반복 개선합니다. 이 결과가 가능한 모든 날개 색 중 전역 최적해라는 보장은 없습니다.</p>`;
  }
}
function drawFocus(i,m){const c=$('focus-canvas');if(!c)return;const ctx=c.getContext('2d'),[x,y]=position(i),bg=treeColor(x,y);const gradient=ctx.createLinearGradient(0,0,500,250);gradient.addColorStop(0,rgb(bg));gradient.addColorStop(1,'#6b5b46');ctx.fillStyle=gradient;ctx.fillRect(0,0,500,250);for(let n=0;n<15;n++){ctx.strokeStyle=n%2?'#201b1720':'#f2ddad22';ctx.lineWidth=2+n%3;ctx.beginPath();ctx.moveTo(n*37,0);ctx.bezierCurveTo(n*37+18,90,n*37-20,170,n*37+12,250);ctx.stroke();}drawMoth(ctx,250,115,m,i,false,1.3);}
function showPage(which){const learn=which==='learn';$('learn-page').classList.toggle('hidden',!learn);$('experiment-page').classList.toggle('hidden',learn);$('learn-tab').classList.toggle('active',learn);$('experiment-tab').classList.toggle('active',!learn);$('learn-tab').setAttribute('aria-selected',String(learn));$('experiment-tab').setAttribute('aria-selected',String(!learn));render();}
function setupLessons(){const cards=$('lesson-cards');LESSONS.forEach(([title,short],i)=>{const button=document.createElement('button');button.type='button';button.className='lesson-card';button.innerHTML=`<span class="num">STEP ${String(i+1).padStart(2,'0')}</span><strong>${title}</strong><span>${short}</span>`;button.addEventListener('click',()=>{[...cards.children].forEach((b,j)=>b.classList.toggle('active',i===j));$('lesson-detail').innerHTML=`<strong>${title}</strong><p>${LESSONS[i][2]}</p>`;});cards.append(button);});cards.firstChild.click();}
$('learn-tab').addEventListener('click',()=>showPage('learn'));
$('experiment-tab').addEventListener('click',()=>showPage('experiment'));
$('start-experiment').addEventListener('click',()=>showPage('experiment'));
$('previous').addEventListener('click',()=>{stopAuto();restore(cursor-1);});
$('next').addEventListener('click',step);
$('reset').addEventListener('click',reset);
function toggleAuto(){if(autoTimer){stopAuto();return;}$('auto').textContent='일시정지 Ⅱ';$('detail-auto').textContent='일시정지 Ⅱ';autoTimer=setInterval(()=>{if(state.phase==='finished'&&cursor===history.length-1){stopAuto();return;}step();},700);}
$('auto').addEventListener('click',toggleAuto);
$('detail-previous').addEventListener('click',()=>{stopAuto();restore(cursor-1);});
$('detail-next').addEventListener('click',step);
$('detail-reset').addEventListener('click',reset);
$('detail-auto').addEventListener('click',toggleAuto);
$('trace-population').addEventListener('click',e=>{const button=e.target.closest('[data-moth]');if(button){state.selected=Number(button.dataset.moth);render();}});
$('trace-content').addEventListener('click',e=>{const button=e.target.closest('[data-child]');if(button){state.focusChild=Number(button.dataset.child);render();}});
function setRate(value){$('rate').value=value;$('detail-rate').value=value;$('rate-value').textContent=`${value}%`;$('detail-rate-value').textContent=`${value}%`;}
$('rate').addEventListener('input',e=>setRate(e.target.value));
$('detail-rate').addEventListener('input',e=>setRate(e.target.value));
$('scene-range').addEventListener('input',e=>{stopAuto();restore(Number(e.target.value));});
$('detail-scene-range').addEventListener('input',e=>{stopAuto();restore(Number(e.target.value));});
$('forest').addEventListener('click',e=>{const rect=e.currentTarget.getBoundingClientRect(),x=(e.clientX-rect.left)*1100/rect.width,y=(e.clientY-rect.top)*700/rect.height;let nearest=-1,distance=75;for(let i=0;i<POP_SIZE;i++){const [mx,my]=position(i),d=Math.hypot(x-mx,y-my);if(d<distance){nearest=i;distance=d;}}if(nearest>=0){state.selected=nearest;render();}});
setupLessons();reset();
