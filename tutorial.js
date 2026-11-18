/* Guided scenes use one continuous, fixed population; part 3 starts a new random forest. */
const GUIDE_BARK = [126, 88, 62];
const GUIDE_START = [
  [0, 2, 6, 9, 13, 3], [4, 7, 12, 2, 8, 14],
  [1, 4, 13, 5, 0, 11], [9, 7, 3, 10, 14, 6],
  [13, 6, 5, 4, 12, 1], [2, 8, 9, 3, 11, 0],
  [4, 4, 7, 6, 13, 10], [10, 5, 12, 14, 2, 9],
  [14, 7, 3, 8, 5, 4], [6, 12, 4, 1, 10, 13],
  [8, 1, 13, 7, 9, 5], [3, 4, 6, 12, 2, 14]
];
const GUIDE_TOPICS = [
  {name:'높은 점수가 주는 이점',question:'점수가 높은 나방은 왜 부모가 될 가능성이 클까요?',answer:'각 나방의 점수에 1을 더한 값을 추첨 구간의 길이로 씁니다. 구간이 길수록 난수가 그 안에 들어갈 가능성이 큽니다.'},
  {name:'낮은 점수에도 남은 기회',question:'가장 좋은 나방만 뽑으면 무슨 일이 생길까요?',answer:'다양한 색 조합을 시험할 기회가 줄어듭니다. 낮은 점수의 나방에도 작은 구간을 남겨 새로운 조합을 만들 수 있게 합니다.'},
  {name:'교차와 변이의 역할',question:'부모에게 없던 색은 어떻게 나타날까요?',answer:'교차는 각 칸에서 부모 한쪽의 색을 그대로 고릅니다. 변이는 고정된 15색 중 하나를 다시 뽑으므로 부모에게 없던 색도 나타날 수 있습니다.'},
  {name:'최고 해를 지키는 이유',question:'변이로 점수가 낮아져도 탐색이 뒤로 갈까요?',answer:'최고 점수 나방 한 마리를 그대로 보존합니다. 새 후보가 나빠져도 지금까지 발견한 최고 해는 유지됩니다.'}
];
const guideScore = colors => {
  const error=colors.reduce((sum,index)=>sum+PALETTE[index].reduce((part,v,c)=>part+Math.abs(v-GUIDE_BARK[c]),0),0)/(colors.length*3);
  return {error,score:99.9/(1+Math.exp((error-65)/8))};
};
const guideGenome = colors => ({colors:[...colors],spots:3, ...guideScore(colors)});
const guideClone = value => JSON.parse(JSON.stringify(value));
let guideSeed=20261103;
function guideRandom(){guideSeed=(Math.imul(1664525,guideSeed)+1013904223)>>>0;return guideSeed/4294967296;}
function guidePick(index,weights){const low=weights.slice(0,index).reduce((a,b)=>a+b,0);return {index,draw:low+weights[index]*0.5,total:weights.reduce((a,b)=>a+b,0),low,high:low+weights[index]};}
function makeGuideRounds(){
  let current=GUIDE_START.map(guideGenome);
  const rounds=[];
  for(let round=0;round<4;round++){
    const before=guideClone(current),ranked=before.map((m,i)=>({i,score:m.score})).sort((a,b)=>b.score-a.score);
    const first=ranked[0].i,second=[ranked[1].i,ranked[11].i,ranked[5].i,ranked[2].i][round];
    const parents=[first,second],weights=before.map(m=>m.score+1),draws=parents.map(i=>guidePick(i,weights));
    const elite=guideClone(before[first]),childrenBefore=[elite],sources=[Array(6).fill('보존')];
    for(let child=1;child<12;child++){
      const origin=Array.from({length:6},()=>guideRandom()<0.5?0:1);
      const colors=origin.map((p,g)=>before[parents[p]].colors[g]);
      childrenBefore.push(guideGenome(colors));sources.push(origin);
    }
    const childrenAfter=guideClone(childrenBefore),mutations=[];
    childrenAfter.forEach(m=>m.mutations=[]);
    for(let child=1;child<12;child++)for(let gene=0;gene<6;gene++)if(guideRandom()<0.18){
      const old=childrenAfter[child].colors[gene];let next=Math.floor(guideRandom()*PALETTE.length);
      if(next===old)next=(next+1)%PALETTE.length;
      childrenAfter[child].colors[gene]=next;childrenAfter[child].mutations.push(gene);mutations.push({child,gene,old,next});
    }
    if(!mutations.length){const child=1,gene=round%6,old=childrenAfter[child].colors[gene],next=(old+4)%PALETTE.length;childrenAfter[child].colors[gene]=next;childrenAfter[child].mutations.push(gene);mutations.push({child,gene,old,next});}
    childrenAfter.forEach(m=>Object.assign(m,guideScore(m.colors)));
    const focus=mutations[0].child;
    rounds.push({before,parents,weights,draws,eliteIndex:first,childrenBefore,childrenAfter,sources,mutations,focus});
    current=guideClone(childrenAfter);
  }
  return rounds;
}
const GUIDE_ROUNDS=makeGuideRounds();
const guidePart1=[
  {kind:'intro',title:'나무껍질에 숨을 수 있을까요?',tag:'01 · 문제 살펴보기',coach:'나무껍질은 그대로이고 나방의 날개 색만 달라집니다. 12마리 중 누가 더 잘 숨는지 먼저 살펴보세요.',hint:'점수는 아직 공개하지 않습니다. 색을 보고 어떤 후보가 좋아 보이는지 예상해 보세요.'},
  {kind:'population',title:'12개의 후보 해를 만듭니다',tag:'02 · 후보 해',coach:'나방 한 마리의 날개 색 여섯 칸이 하나의 후보 해입니다. 각 칸은 정해진 15색 중 하나에서 시작합니다.',hint:'위의 갈색 나무껍질과 각 나방의 색 여섯 칸을 비교해 보세요.'},
  {kind:'evaluate',title:'같은 기준으로 모두 평가합니다',tag:'03 · 점수 계산',coach:'날개 색과 나무껍질의 RGB 차이를 계산하고 위장 점수로 바꿉니다. 모든 나방에 같은 배경 색을 적용합니다.',hint:'오차가 작을수록 위장 점수가 큽니다. 다음부터는 이 점수를 선택에 사용합니다.'}
];
for(let r=0;r<4;r++){
  guidePart1.push({kind:'select',round:r,title:'점수에 따라 부모를 뽑습니다',tag:'① 부모 선택',coach:'점수에 1을 더한 값이 추첨 구간의 길이가 됩니다. 구간이 긴 나방이 더 자주 뽑히지만, 다른 나방도 기회가 있습니다.',hint:'부모 A와 B가 실제로 어느 구간에서 뽑혔는지 살펴보세요.'});
  guidePart1.push({kind:'cross',round:r,title:'부모의 색을 칸마다 물려받습니다',tag:'② 유전자 교차',coach:'자손의 날개 색 여섯 칸은 각각 부모 A 또는 B의 해당 칸을 그대로 받습니다. 두 색의 중간색을 만들지는 않습니다.',hint:'자손의 각 색 아래 출처를 확인해 보세요.'});
  guidePart1.push({kind:'mutation',round:r,title:'일부 색이 다시 뽑힙니다',tag:'③ 돌연변이',coach:'각 색 칸마다 작은 확률로 고정된 15색 중 하나를 다시 뽑습니다. 지금은 변이가 일어난 한 자손을 확대해 보여줍니다.',hint:'바뀌기 전과 후의 색을 비교해 보세요. 점수가 항상 좋아지지는 않습니다.'});
  guidePart1.push({kind:'replace',round:r,title:'새 세대를 평가하고 이어갑니다',tag:'④ 세대 교체',coach:'자손이 다음 세대의 12마리가 됩니다. 가장 좋았던 나방 한 마리는 그대로 보존하고 새 점수를 확인합니다.',hint:'최고 점수가 이전 세대보다 높아졌는지 확인해 보세요.'});
}
const guidePart2=[];
for(let r=0;r<4;r++){
  const topic=GUIDE_TOPICS[r];
  guidePart2.push({kind:'question',round:r,title:topic.name,tag:`${topic.name} · 질문`,coach:topic.question,hint:'다음 장면에서 실제 점수와 확률을 함께 확인합니다.'});
  guidePart2.push({kind:'probability',round:r,title:'점수를 확률 구간으로 바꿉니다',tag:`${topic.name} · 확률`,coach:'점수 + 1을 가중치로 정하고 전체 가중치로 나눕니다. 높은 점수는 넓은 구간, 낮은 점수는 좁은 구간을 가집니다.',hint:'확률이 낮아도 0이 아니면 뽑힐 수 있습니다.'});
  guidePart2.push({kind:'draw',round:r,title:'난수가 부모를 결정합니다',tag:`${topic.name} · 실제 추첨`,coach:'0부터 가중치 합계까지 난수를 뽑습니다. 난수가 들어간 구간의 나방이 부모가 됩니다.',hint:'이번에 선택된 두 나방의 번호와 구간을 확인해 보세요.'});
  guidePart2.push({kind:'diversity',round:r,title:'교차와 변이가 새 조합을 만듭니다',tag:`${topic.name} · 새 후보`,coach:'교차는 각 칸의 색을 부모 한쪽에서 물려받고, 변이는 고정된 15색 중 하나를 다시 뽑습니다. 최고 해는 복사해 안전하게 남깁니다.',hint:'보존된 해와 변이가 일어난 자손을 비교해 보세요.'});
  guidePart2.push({kind:'takeaway',round:r,title:'이번 장면에서 배울 점',tag:`${topic.name} · 정리`,coach:topic.answer,hint:'다음 장면에서는 다른 선택과 변이 결과를 봅니다.'});
}
let guidePart=1,guideFrame=0;
const guideFrames=()=>guidePart===1?guidePart1:guidePart2;
const guideRgb=index=>`rgb(${PALETTE[index].join(',')})`;
const guideColor=index=>`#${PALETTE[index].map(v=>v.toString(16).padStart(2,'0')).join('')}`;
function guideGeneStrip(genome,source){return `<div class="guide-gene-strip">${genome.colors.map((gene,j)=>`<div><i style="background:${guideRgb(gene)}"></i><small>${guideColor(gene)}</small>${source?`<b>${source[j]===0?'부모 A':source[j]===1?'부모 B':'보존'}</b>`:''}</div>`).join('')}</div>`;}
function guidePopulation(pop,emphasis=[],showScore=true){return `<div class="guide-population">${pop.map((m,i)=>`<div class="guide-moth ${emphasis.includes(i)?'emphasis':''}"><span>${String(i+1).padStart(2,'0')}</span>${mothSvg(m,`guide-moth-${i}`)}<small>${showScore?`${m.score.toFixed(1)}%`:'점수 ?'}</small></div>`).join('')}</div>`;}
function guideProbability(round){const total=round.weights.reduce((a,b)=>a+b,0);return `<div class="guide-probability">${round.before.map((m,i)=>`<div class="guide-prob-row ${round.parents.includes(i)?'chosen':''}"><span>나방 ${i+1}</span><strong>${m.score.toFixed(1)}%</strong><div><i style="width:${(round.weights[i]/total*100*4).toFixed(1)}%"></i></div><b>${(round.weights[i]/total*100).toFixed(1)}%</b></div>`).join('')}</div>`;}
function guideVisual(frame){
  const round=GUIDE_ROUNDS[frame.round??0];
  const intro=['intro','population','evaluate'].includes(frame.kind);
  const before=intro?GUIDE_ROUNDS[0].before:round.before;
  const after=round.childrenAfter,focus=round.focus,focusMutations=round.mutations.filter(m=>m.child===focus);
  const hero=`<div class="guide-scene-head"><div><span class="guide-kicker">FOREST COLOR STUDY</span><h2>같은 나무껍질, 다른 날개 색</h2></div><div class="guide-target"><span>고정된 나무껍질</span><i style="background:rgb(${GUIDE_BARK.join(',')})"></i><strong>rgb(${GUIDE_BARK.join(', ')})</strong></div></div>`;
  const pop=frame.kind==='replace'?after:before;
  const selected=frame.kind==='select'||frame.kind==='draw'?round.parents:[];
  const population=`${guidePopulation(pop,selected,frame.kind!=='intro'&&frame.kind!=='population'&&frame.kind!=='question')}<p class="guide-caption">나방 번호는 위치가 아닌 후보 해의 번호입니다. 나무껍질 색은 모든 후보에 동일합니다.</p>`;
  let evidence='';
  if(frame.kind==='evaluate'){
    const top=before.map((m,i)=>({m,i})).sort((a,b)=>b.m.score-a.m.score)[0];
    evidence=`<div class="guide-evidence"><h3>한 후보를 계산해 보면</h3>${guideGeneStrip(top.m)}<p>나방 ${top.i+1}번의 평균 RGB 오차 <strong>${top.m.error.toFixed(1)}</strong></p><p>점수 = 99.9 ÷ (1 + e<sup>(오차 − 65) ÷ 8</sup>) = <strong>${top.m.score.toFixed(1)}%</strong></p></div>`;
  } else if(['select','probability','draw'].includes(frame.kind)){
    evidence=`<div class="guide-evidence"><h3>점수 → 추첨 구간 → 부모</h3>${guideProbability(round)}${frame.kind==='select'||frame.kind==='draw'?`<div class="guide-draws">${round.draws.map((d,i)=>`<p>부모 ${i===0?'A':'B'} · 난수 <strong>${d.draw.toFixed(1)}</strong> ∈ [${d.low.toFixed(1)}, ${d.high.toFixed(1)}) → <strong>나방 ${d.index+1}</strong></p>`).join('')}</div>`:''}</div>`;
  } else if(['cross','mutation','diversity'].includes(frame.kind)){
    evidence=`<div class="guide-evidence"><h3>부모 ${round.parents[0]+1}번 + ${round.parents[1]+1}번 → 자손 ${focus+1}번</h3>${inheritanceDiagram(round.before[round.parents[0]],round.before[round.parents[1]],round.childrenBefore[focus],round.sources[focus],frame.kind==='cross'?null:after[focus])}${frame.kind==='cross'?'<p>굵은 테두리의 부모 색이 그 칸의 자손 색으로 그대로 전달됩니다. 다음 장면에서 변이를 확인하세요.</p>':`<div class="guide-mutation-result">변이 ${focusMutations.length}칸 · ${focusMutations.map(m=>`날개 ${m.gene+1}: ${guideColor(m.old)} → ${guideColor(m.next)}`).join(' · ')}<br>점수 ${round.childrenBefore[focus].score.toFixed(1)}% → ${after[focus].score.toFixed(1)}%</div>`}</div>`;
  } else if(['replace','takeaway'].includes(frame.kind)){
    const oldBest=Math.max(...before.map(m=>m.score)),newBest=Math.max(...after.map(m=>m.score));
    evidence=`<div class="guide-evidence"><h3>한 세대의 결과</h3><div class="guide-result-metrics"><span>이전 최고 <strong>${oldBest.toFixed(1)}%</strong></span><b>→</b><span>새 세대 최고 <strong>${newBest.toFixed(1)}%</strong></span></div><p>최고 나방 ${round.eliteIndex+1}번은 변이 없이 복사됩니다. 새 자손이 나빠져도 발견한 최고 해를 잃지 않습니다.</p></div>`;
  }
  if(frame.kind==='diversity')evidence+=`<div class="guide-evidence guide-rate-panel"><h3>변이 확률이 바뀌면?</h3><p>날개 색 유전자 6개 중 적어도 하나에서 변이를 시도할 확률 = 1 − (1 − 변이 확률)<sup>6</sup></p>${[0,.12,.3,.5].map(rate=>{const chance=100*(1-(1-rate)**6);return `<div><span>유전자별 ${(rate*100).toFixed(0)}%</span><i><b style="width:${chance}%"></b></i><strong>${chance.toFixed(1)}%</strong></div>`;}).join('')}<small>변이가 일어나도 더 좋은 색이 된다는 보장은 없습니다. 반점 유전자는 이 그래프에서 제외했습니다.</small></div>`;
  return `<div class="guide-scene">${hero}${population}${evidence}</div>`;
}
function renderGuide(){
  const frames=guideFrames(),frame=frames[guideFrame];
  document.getElementById('course-part-label').textContent=`PART ${String(guidePart).padStart(2,'0')} / 03`;
  document.getElementById('tutorial-count').textContent=`장면 ${guideFrame+1} / ${frames.length}`;
  document.getElementById('tutorial-visual').innerHTML=guideVisual(frame);
  document.getElementById('tutorial-coach').innerHTML=`<div class="guide-coach"><span>${frame.tag}</span><h2>${frame.title}</h2><p>${frame.coach}</p><div>${frame.hint}</div></div>`;
  document.getElementById('tutorial-prev').disabled=guideFrame===0;
  document.getElementById('tutorial-next').textContent=guideFrame===frames.length-1?(guidePart===1?'2부로 이동 →':'3부 실험하기 →'):'다음 →';
}
function showCoursePart(part){
  guidePart=part;
  document.getElementById('tutorial-page').classList.toggle('hidden',part===3);
  document.getElementById('lab-pages').classList.toggle('hidden',part!==3);
  for(let i=1;i<=3;i++)document.getElementById(`course-part-${i}`).classList.toggle('active',i===part);
  document.getElementById('course-part-label').textContent=`PART ${String(part).padStart(2,'0')} / 03`;
  if(part!==3)renderGuide();
}
for(let i=1;i<=3;i++)document.getElementById(`course-part-${i}`).addEventListener('click',()=>{guideFrame=0;showCoursePart(i);});
document.getElementById('tutorial-prev').addEventListener('click',()=>{if(guideFrame>0){guideFrame--;renderGuide();}});
document.getElementById('tutorial-next').addEventListener('click',()=>{if(guideFrame<guideFrames().length-1){guideFrame++;renderGuide();}else{guideFrame=0;showCoursePart(Math.min(3,guidePart+1));}});
document.getElementById('tutorial-reset').addEventListener('click',()=>{guideFrame=0;renderGuide();});
renderGuide();
