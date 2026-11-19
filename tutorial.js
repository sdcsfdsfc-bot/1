/* A fixed, reproducible walk through the same pattern genome used in the lab. */
const GUIDE_FOREST={base:3,patches:[]};
let guideSeed=20261103;
function guideRandom(){guideSeed=(Math.imul(1664525,guideSeed)+1013904223)>>>0;return guideSeed/4294967296;}
function guideEvaluate(m){const result=patternScore(m,GUIDE_FOREST);m.score=result.score;m.error=result.mean;return m;}
function guideClone(m){return JSON.parse(JSON.stringify(m));}
function makeGuideRounds(){
  let population=Array.from({length:12},()=>guideEvaluate(patternGenome(guideRandom))),rounds=[];
  for(let r=0;r<3;r++){
    const before=population.map(guideClone);
    const weights=before.map(m=>m.score+1),total=weights.reduce((a,b)=>a+b,0);
    function choose(){const draw=guideRandom()*total;let accumulated=0;for(let i=0;i<12;i++){const low=accumulated;accumulated+=weights[i];if(draw<accumulated)return {index:i,draw,low,high:accumulated};}return {index:11,draw,low:accumulated-weights[11],high:accumulated};}
    const firstDraws=[choose(),choose()];
    const eliteIndex=before.reduce((best,m,i)=>m.score>before[best].score?i:best,0);
    const childrenBefore=[guideClone(before[eliteIndex])],sources=[Array(GENE_COUNT).fill(null)],childDraws=[null],childParents=[null];
    for(let i=1;i<12;i++){
      const draws=i===1?firstDraws:[choose(),choose()],parents=draws.map(d=>d.index);
      childDraws.push(draws);childParents.push(parents);
      const mix=Array.from({length:GENE_COUNT},()=>.15+guideRandom()*.7);
      const genes=mix.map((w,j)=>clamp(before[parents[0]].genes[j]*w+before[parents[1]].genes[j]*(1-w),PATTERN_GENES[j].min,PATTERN_GENES[j].max));
      childrenBefore.push(guideEvaluate({genes,mutations:[]}));sources.push(mix);
    }
    const childrenAfter=childrenBefore.map(guideClone),mutations=[];
    for(let i=1;i<12;i++)for(let j=0;j<GENE_COUNT;j++)if(guideRandom()<.12){
      const spec=PATTERN_GENES[j],old=childrenAfter[i].genes[j],span=spec.max-spec.min,delta=(guideRandom()+guideRandom()+guideRandom()-1.5)*span*.26;
      const reroll=guideRandom()<.08;
      childrenAfter[i].genes[j]=reroll?spec.min+guideRandom()*span:clamp(old+delta,spec.min,spec.max);childrenAfter[i].mutations.push(j);mutations.push({child:i,gene:j,old,next:childrenAfter[i].genes[j],reroll});
    }
    if(!mutations.length){const i=1,j=7,old=childrenAfter[i].genes[j];childrenAfter[i].genes[j]=clamp(old+.18,PATTERN_GENES[j].min,PATTERN_GENES[j].max);childrenAfter[i].mutations.push(j);mutations.push({child:i,gene:j,old,next:childrenAfter[i].genes[j],reroll:false});}
    childrenAfter.forEach(guideEvaluate);
    const focus=mutations[0].child;
    rounds.push({before,weights,total,draws:childDraws[focus],parents:childParents[focus],eliteIndex,childrenBefore,childrenAfter,sources,mutations,focus});
    population=childrenAfter.map(guideClone);
  }
  return rounds;
}
const GUIDE_ROUNDS=makeGuideRounds();
const guidePart1=[
  {kind:'intro',round:0,tag:'문제 소개',title:'어떤 나방이 나무껍질에 잘 숨을까요?',coach:'같은 나무 위에 무늬가 다른 나방 12마리가 있습니다. 이 중 배경에 잘 섞이는 무늬를 찾는 것이 목표입니다. 먼저 점수를 보지 않고 예상해 보세요.',hint:'실제 새의 공격은 일어나지 않습니다. 날개와 배경의 색 차이로 위장 점수를 계산합니다.'},
  {kind:'genome',round:0,tag:'무엇을 바꾸나요?',title:'날개 그림을 만드는 숫자 12개를 바꿉니다',coach:'바탕색 3개, 무늬색 3개, 무늬 형태를 정하는 숫자 6개가 한 나방의 유전자입니다. 알고리즘은 이 숫자 조합을 바꿔 더 잘 숨는 무늬를 찾습니다.',hint:'유전자는 완성된 그림이 아니라 그림을 다시 만드는 설계도입니다.'},
  {kind:'make',round:0,tag:'해 만들기',title:'숫자를 날개 무늬로 바꿉니다',coach:'반응·확산 무늬를 선택하고 크기와 비율을 바꿉니다. 기준값으로 바탕과 무늬 영역을 나눈 뒤 두 색을 입힙니다.',hint:'후보 해 하나가 나방 한 마리의 날개 무늬가 됩니다.'},
  {kind:'evaluate',round:0,tag:'① 평가',title:'12마리를 같은 기준으로 평가합니다',coach:'날개 여러 지점의 RGB 색과 고정된 나무껍질 색을 비교합니다. 평균 차이가 작을수록 위장 점수가 큽니다.',hint:'모든 후보를 같은 나무 배경에서 비교합니다.'}
];
for(let r=0;r<3;r++){
  guidePart1.push({kind:'probability',round:r,tag:`${r+1}세대 · ② 선택 확률`,title:'점수를 부모 선택 확률로 바꿉니다',coach:'나방마다 점수 + 1만큼 추첨 구간을 배정합니다. 구간이 넓을수록 부모가 될 가능성이 높지만, 낮은 점수에도 기회가 남습니다.',hint:'표의 점수와 선택 확률을 비교해 보세요.'});
  guidePart1.push({kind:'draw',round:r,tag:`${r+1}세대 · ③ 부모 추첨`,title:'난수 두 개로 부모를 뽑습니다',coach:'전체 추첨 구간에서 난수를 두 번 뽑습니다. 각 난수가 들어간 구간의 나방이 이 자손의 부모 A와 B가 됩니다.',hint:'노란색으로 표시된 나방과 실제 난수 구간을 확인하세요.'});
  guidePart1.push({kind:'crossColor',round:r,tag:`${r+1}세대 · ④ 색 교차`,title:'부모의 바탕색·무늬색 숫자를 섞습니다',coach:'L*a*b* 색 좌표 여섯 개를 대응하는 부모 값끼리 가중평균합니다. 자손의 색은 두 부모 사이의 새로운 값이 됩니다.',hint:'표에서 부모 A 비율을 곱해 자손 색 좌표를 확인하세요.'});
  guidePart1.push({kind:'crossShape',round:r,tag:`${r+1}세대 · ⑤ 형태 교차`,title:'무늬 종류와 크기도 섞습니다',coach:'무늬 종류·크기·기준값·늘이기·경계·작은 점의 숫자도 같은 방법으로 교차합니다. 그래서 색뿐 아니라 무늬 모양도 바뀝니다.',hint:'부모와 교차 직후 자손의 날개 모양을 비교하세요.'});
  guidePart1.push({kind:'mutation',round:r,tag:`${r+1}세대 · ⑥ 변이`,title:'일부 숫자가 무작위로 달라집니다',coach:'교차가 끝난 자손의 일부 숫자에 작은 변화를 줍니다. 드물게 새 값을 뽑기도 합니다. 새 무늬의 점수는 오를 수도, 내릴 수도 있습니다.',hint:'표의 표시된 유전자와 변이 전후의 날개를 비교하세요.'});
  guidePart1.push({kind:'replace',round:r,tag:`${r+1}세대 · ⑦ 세대 교체`,title:'자손을 평가해 다음 세대로 넘깁니다',coach:'자손 11마리와 이전 세대 최고 나방 한 마리가 다음 집단이 됩니다. 최고 나방은 교차·변이 없이 보존합니다.',hint:r===2?'이제 새 숲과 새 나방 집단으로 직접 실험을 시작할 수 있습니다.':'새로운 최고 점수와 이전 점수를 비교하세요.'});
}
let guidePart=1,guideFrame=0;
function guideFrames(){return guidePart1;}
function guidePopulation(pop,emphasis=[],reveal=true){
  return `<div class="pattern-guide-pop">${pop.map((m,i)=>`<div class="pattern-guide-moth ${emphasis.includes(i)?'emphasis':''}"><span>나방 ${i+1}</span><canvas width="150" height="100" data-guide-moth="${i}"></canvas><strong>${reveal?m.score.toFixed(1)+'%':'점수 ?'}</strong></div>`).join('')}</div>`;
}
function guideWorkedExample(round,kind,a,b,before,after){
  if(kind==='mutation'){
    const change=round.mutations.find(m=>m.child===round.focus),precision=change.gene<6?1:2;
    const old=change.old.toFixed(precision),next=change.next.toFixed(precision),delta=change.next-change.old;
    return `<div class="guide-worked"><span>한 유전자의 변화</span><h4>${PATTERN_GENES[change.gene].name}</h4><div class="guide-worked-flow"><div><small>교차 직후</small><strong>${old}</strong></div><b>→</b><div><small>${change.reroll?'새 숫자 뽑기':`변이 ${delta>=0?'+':''}${delta.toFixed(precision)}`}</small><strong>${next}</strong></div></div><p>바뀐 숫자로 날개 전체를 다시 그린 뒤 위장 점수를 다시 계산합니다.</p></div>`;
  }
  const j=kind==='crossColor'?0:7,w=round.sources[round.focus][j],digits=j<6?1:2;
  const av=a.genes[j].toFixed(digits),bv=b.genes[j].toFixed(digits),cv=before.genes[j].toFixed(digits);
  return `<div class="guide-worked"><span>한 유전자 계산 예시</span><h4>${PATTERN_GENES[j].name}</h4><div class="guide-worked-flow"><div><small>부모 A</small><strong>${av}</strong></div><b>× ${(w*100).toFixed(1)}% +</b><div><small>부모 B</small><strong>${bv}</strong></div><b>× ${((1-w)*100).toFixed(1)}% =</b><div class="result"><small>자손</small><strong>${cv}</strong></div></div><p>부모의 같은 유전자끼리 계산합니다. 나머지 유전자도 각자의 비율로 계산합니다.</p></div>`;
}
function guideVisual(frame){
  const round=GUIDE_ROUNDS[frame.round],kind=frame.kind,showAfter=kind==='replace',pop=showAfter?round.childrenAfter:round.before;
  const selected=kind==='draw'?round.parents:[],focus=round.focus,chosen=kind==='genome'||kind==='make'||kind==='evaluate'?round.before.reduce((best,m,i)=>m.score>round.before[best].score?i:best,0):focus;
  let extra='';
  if(kind==='genome'||kind==='make'||kind==='evaluate'){
    const m=round.before[chosen];
    extra=`<div class="pattern-guide-detail"><div><h3>나방 ${chosen+1}의 설계도</h3><canvas id="guide-focus" width="250" height="140"></canvas>${kind==='evaluate'?`<p>평균 RGB 차이 <strong>${m.error.toFixed(2)}</strong> → 위장 점수 <strong>${m.score.toFixed(1)}%</strong></p>`:''}</div><div>${kind==='make'?patternStagesMarkup():patternGeneRows(m)}</div></div>`;
  }else if(kind==='probability'||kind==='draw'){
    extra=`<div class="guide-evidence"><h3>${kind==='draw'?'난수가 들어간 구간의 나방을 부모로 선택':'점수를 추첨 구간의 넓이로 변환'}</h3><div class="guide-probability">${round.before.map((m,i)=>`<div class="guide-prob-row ${selected.includes(i)?'chosen':''}"><span>나방 ${i+1}</span><strong>${m.score.toFixed(1)}%</strong><div><i style="width:${Math.min(100,round.weights[i]/round.total*380)}%"></i></div><b>${(round.weights[i]/round.total*100).toFixed(1)}%</b></div>`).join('')}</div>${kind==='draw'?`<div class="guide-draws">${round.draws.map((d,j)=>`<p>부모 ${j?'B':'A'}: 난수 ${d.draw.toFixed(1)} ∈ [${d.low.toFixed(1)}, ${d.high.toFixed(1)}) → <strong>나방 ${d.index+1}</strong></p>`).join('')}</div>`:''}</div>`;
  }else if(kind==='crossColor'||kind==='crossShape'||kind==='mutation'){
    const [a,b]=round.parents.map(i=>round.before[i]),before=round.childrenBefore[focus],after=round.childrenAfter[focus];
    const indices=kind==='crossColor'?[0,1,2,3,4,5]:kind==='crossShape'?[6,7,8,9,10,11]:after.mutations;
    const worked=guideWorkedExample(round,kind,a,b,before,after);
    const compare=kind==='mutation'
      ?'<div class="pattern-compare guide-mutation-compare"><div><span>교차 직후</span><canvas width="190" height="100" data-guide-compare="before"></canvas></div><div><span>변이 후</span><canvas width="190" height="100" data-guide-compare="after"></canvas></div></div>'
      :'<div class="pattern-compare"><div><span>부모 A</span><canvas width="190" height="100" data-guide-compare="a"></canvas></div><div><span>부모 B</span><canvas width="190" height="100" data-guide-compare="b"></canvas></div><div><span>교차 직후 자손</span><canvas width="190" height="100" data-guide-compare="before"></canvas></div></div>';
    extra=`<div class="guide-evidence"><h3>${kind==='mutation'? `자손 ${focus+1}: 교차 직후 → 변이 후`:`부모 A(${round.parents[0]+1}) + B(${round.parents[1]+1}) → 자손 ${focus+1}`}</h3>${worked}${compare}${kind==='mutation'?`<p class="guide-score-change">위장 점수 <strong>${before.score.toFixed(1)}%</strong> → <strong>${after.score.toFixed(1)}%</strong></p>`:''}${patternInheritance(a,b,before,round.sources[focus],kind==='mutation'?after:null,indices)}</div>`;
  }else if(kind==='replace'){
    extra=`<div class="guide-evidence"><h3>세대 변화</h3><div class="guide-result-metrics"><span>이전 최고 <strong>${Math.max(...round.before.map(m=>m.score)).toFixed(1)}%</strong></span><b>→</b><span>새 세대 최고 <strong>${Math.max(...round.childrenAfter.map(m=>m.score)).toFixed(1)}%</strong></span></div><p>이전 세대 최고였던 나방 ${round.eliteIndex+1}번을 변이 없이 보존했습니다.</p></div>`;
  }
  return `<div class="guide-scene"><div class="guide-scene-head"><div><span class="guide-kicker">PATTERN EVOLUTION</span><h2>${frame.round+1}번째 세대 · 같은 나무껍질</h2></div><div class="guide-target"><span>고정 배경</span><i style="background:${rgb(BARK[GUIDE_FOREST.base])}"></i><strong>${rgb(BARK[GUIDE_FOREST.base])}</strong></div></div>${guidePopulation(pop,selected,kind!=='intro'&&kind!=='genome'&&kind!=='make')}${extra}</div>`;
}
function renderGuide(){
  const frames=guideFrames(),frame=frames[guideFrame];
  $('course-part-label').textContent='PART 01 / 02';
  $('tutorial-count').textContent=`장면 ${guideFrame+1} / ${frames.length}`;
  const stages=['intro','genome','make','evaluate','probability','draw','crossColor','crossShape','mutation','replace'];
  const labels=['문제','유전자','무늬 생성','평가','선택 확률','부모 추첨','색 교차','무늬 교차','변이','세대 교체'];
  $('guide-step-strip').innerHTML=labels.map((label,i)=>`<span class="${stages[i]===frame.kind?'active':''}">${label}</span>`).join('');
  const strip=$('guide-step-strip'),active=strip.querySelector('.active');
  strip.scrollLeft=active.offsetLeft-strip.offsetLeft-strip.clientWidth/2+active.clientWidth/2;
  $('tutorial-visual').innerHTML=guideVisual(frame);
  $('tutorial-coach').innerHTML=`<div class="guide-coach"><span>${frame.tag}</span><h2>${frame.title}</h2><p>${frame.coach}</p><div>${frame.hint}</div></div>`;
  $('tutorial-prev').disabled=guideFrame===0;
  $('tutorial-next').textContent=guideFrame===frames.length-1?'직접 실험하기 →':'다음 →';
  const pop=frame.kind==='replace'?GUIDE_ROUNDS[frame.round].childrenAfter:GUIDE_ROUNDS[frame.round].before;
  document.querySelectorAll('[data-guide-moth]').forEach(canvas=>paintPatternMoth(canvas.getContext('2d'),75,49,pop[Number(canvas.dataset.guideMoth)],.7,false,null));
  const focus=$('guide-focus');if(focus){const chosen=pop.reduce((best,m,i)=>m.score>pop[best].score?i:best,0);paintPatternMoth(focus.getContext('2d'),125,69,pop[chosen],1.2,false,null);}
  if(frame.kind==='make'){const chosen=pop.reduce((best,m,i)=>m.score>pop[best].score?i:best,0);drawPatternStages(pop[chosen]);}
  if(['crossColor','crossShape','mutation'].includes(frame.kind)){
    const round=GUIDE_ROUNDS[frame.round],models={a:round.before[round.parents[0]],b:round.before[round.parents[1]],before:round.childrenBefore[round.focus],after:round.childrenAfter[round.focus]};
    document.querySelectorAll('[data-guide-compare]').forEach(canvas=>paintPatternMoth(canvas.getContext('2d'),95,49,models[canvas.dataset.guideCompare],.95,false,null));
  }
}
function showCoursePart(part){
  stopAuto();
  guidePart=part;$('tutorial-page').classList.toggle('hidden',part===2);$('lab-pages').classList.toggle('hidden',part!==2);
  for(let i=1;i<=2;i++)$('course-part-'+i).classList.toggle('active',i===part);
  $('course-part-label').textContent=`PART 0${part} / 02`;
  if(part===1)renderGuide();
  else{showPage('experiment');if(state.phase==='initial')step();}
}
for(let i=1;i<=2;i++)$('course-part-'+i).addEventListener('click',()=>{guideFrame=0;showCoursePart(i);});
$('tutorial-prev').addEventListener('click',()=>{if(guideFrame>0){guideFrame--;renderGuide();}});
$('tutorial-next').addEventListener('click',()=>{if(guideFrame<guideFrames().length-1){guideFrame++;renderGuide();}else{guideFrame=0;showCoursePart(2);}});
$('tutorial-reset').addEventListener('click',()=>{guideFrame=0;renderGuide();});
renderGuide();
