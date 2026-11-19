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
    const draws=[choose(),choose()],parents=draws.map(d=>d.index);
    const eliteIndex=before.reduce((best,m,i)=>m.score>before[best].score?i:best,0);
    const childrenBefore=[guideClone(before[eliteIndex])],sources=[Array(GENE_COUNT).fill(null)];
    for(let i=1;i<12;i++){
      const mix=Array.from({length:GENE_COUNT},()=>.15+guideRandom()*.7);
      const genes=mix.map((w,j)=>clamp(before[parents[0]].genes[j]*w+before[parents[1]].genes[j]*(1-w),PATTERN_GENES[j].min,PATTERN_GENES[j].max));
      childrenBefore.push(guideEvaluate({genes,mutations:[]}));sources.push(mix);
    }
    const childrenAfter=childrenBefore.map(guideClone),mutations=[];
    for(let i=1;i<12;i++)for(let j=0;j<GENE_COUNT;j++)if(guideRandom()<.12){
      const spec=PATTERN_GENES[j],old=childrenAfter[i].genes[j],delta=(guideRandom()+guideRandom()+guideRandom()-1.5)*(spec.max-spec.min)*.16;
      childrenAfter[i].genes[j]=clamp(old+delta,spec.min,spec.max);childrenAfter[i].mutations.push(j);mutations.push({child:i,gene:j,old,next:childrenAfter[i].genes[j]});
    }
    if(!mutations.length){const i=1,j=7,old=childrenAfter[i].genes[j];childrenAfter[i].genes[j]=clamp(old+.18,PATTERN_GENES[j].min,PATTERN_GENES[j].max);childrenAfter[i].mutations.push(j);mutations.push({child:i,gene:j,old,next:childrenAfter[i].genes[j]});}
    childrenAfter.forEach(guideEvaluate);
    rounds.push({before,weights,total,draws,parents,eliteIndex,childrenBefore,childrenAfter,sources,mutations,focus:mutations[0].child});
    population=childrenAfter.map(guideClone);
  }
  return rounds;
}
const GUIDE_ROUNDS=makeGuideRounds();
const guidePart1=[
  {kind:'intro',round:0,tag:'01 · 문제',title:'어떤 나방이 나무껍질에 잘 숨을까요?',coach:'같은 배경 위에 무늬가 다른 나방 12마리가 있습니다. 점수를 보기 전에 잘 숨을 것 같은 나방을 골라 보세요.',hint:'실제 새의 공격은 이 모형에서 일어나지 않습니다. 색 차이로 위장 점수를 계산합니다.'},
  {kind:'genome',round:0,tag:'02 · 유전자',title:'전달되는 것은 그림이 아니라 숫자입니다',coach:'한 나방은 바탕색 3개, 무늬색 3개, 무늬의 모양과 크기 등을 정하는 숫자 6개를 가집니다.',hint:'유전자가 12개라고 해서 날개가 12칸으로 나뉘는 것은 아닙니다.'},
  {kind:'make',round:0,tag:'03 · 무늬 만들기',title:'숫자로 무늬를 다시 그립니다',coach:'반응·확산으로 만든 흑백 무늬를 고르고 크기를 조절합니다. 기준값으로 두 영역을 나눈 다음 각각 바탕색과 무늬색을 입힙니다.',hint:'자손에게는 완성된 그림 파일이 복사되지 않습니다.'},
  {kind:'evaluate',round:0,tag:'04 · 평가',title:'배경과 날개 전체를 비교합니다',coach:'날개 표본의 RGB 값과 고정된 나무껍질 색의 차이를 평균냅니다. 차이가 작을수록 높은 점수입니다.',hint:'이 점수는 학습용 규칙이며 사람이나 새의 실제 판단이 아닙니다.'}
];
for(let r=0;r<3;r++){
  guidePart1.push({kind:'select',round:r,tag:'① 선택',title:'점수에 따라 부모를 뽑습니다',coach:'점수에 1을 더한 값을 추첨 구간의 길이로 씁니다. 높은 점수는 더 넓은 구간을 갖지만 다른 나방도 뽑힐 수 있습니다.',hint:'부모 A·B의 난수가 어느 구간에 들어갔는지 확인하세요.'});
  guidePart1.push({kind:'cross',round:r,tag:'② 교차',title:'부모의 숫자를 섞습니다',coach:'각 유전자에서 부모 A와 B의 숫자를 가중평균합니다. 자손은 두 부모의 색과 무늬 특성을 함께 가질 수 있습니다.',hint:'표에서 A 비율과 교차 직후 값을 비교하세요.'});
  guidePart1.push({kind:'mutation',round:r,tag:'③ 변이',title:'숫자 일부가 조금 달라집니다',coach:'각 유전자에 작은 확률로 값을 더하거나 뺍니다. 그림 전체를 다시 만들므로 바뀐 숫자 하나가 무늬에도 영향을 줄 수 있습니다.',hint:'교차 직후와 변이 후의 나방을 비교하세요.'});
  guidePart1.push({kind:'replace',round:r,tag:'④ 교체',title:'자손이 다음 세대가 됩니다',coach:'자손을 다시 평가하고 가장 좋은 이전 나방 한 마리를 그대로 보존합니다.',hint:'최고 점수가 전 세대보다 어떻게 달라졌는지 보세요.'});
}
const guidePart2=[
  {kind:'question',round:0,tag:'원리 1',title:'무엇이 자손에게 전달되나요?',coach:'완성된 날개 그림이 아니라 그림을 만드는 숫자 12개가 전달됩니다.',hint:'숫자 → 흑백 무늬 → 영역 구분 → 색 입히기 순서로 보세요.'},
  {kind:'make',round:0,tag:'원리 2',title:'무늬 종류 숫자가 중간이면?',coach:'두 흑백 무늬를 그 값에 따라 섞습니다. 크기와 줄무늬 늘이기 값도 새 모양을 만듭니다.',hint:'모양 유전자와 색 유전자는 서로 다른 역할을 합니다.'},
  {kind:'select',round:1,tag:'원리 3',title:'낮은 점수도 부모가 될 수 있나요?',coach:'그렇습니다. 모든 나방은 점수 + 1만큼 양수의 추첨 구간을 갖습니다.',hint:'다양성을 남겨 두면 다른 조합을 시험할 수 있습니다.'},
  {kind:'cross',round:1,tag:'원리 4',title:'색을 섞는다는 뜻은?',coach:'부모의 L*a*b* 색 좌표를 가중평균합니다. 자손의 바탕색과 무늬색은 부모 사이의 새 색이 될 수 있습니다.',hint:'색을 RGB로 먼저 섞는 방식은 아닙니다.'},
  {kind:'mutation',round:2,tag:'원리 5',title:'변이는 늘 더 좋은가요?',coach:'아닙니다. 작은 무작위 변화가 점수를 올리거나 내릴 수 있습니다.',hint:'변이 전후의 예상 점수를 비교하세요.'},
  {kind:'replace',round:2,tag:'원리 6',title:'좋은 해를 잃지 않는 방법',coach:'가장 점수가 높았던 나방 한 마리를 복사해 다음 세대에 넣습니다. 나머지는 교차와 변이를 거칩니다.',hint:'3부에서 새 숲을 만들고 직접 확인해 보세요.'}
];
let guidePart=1,guideFrame=0;
function guideFrames(){return guidePart===1?guidePart1:guidePart2;}
function guidePopulation(pop,emphasis=[],reveal=true){
  return `<div class="pattern-guide-pop">${pop.map((m,i)=>`<div class="pattern-guide-moth ${emphasis.includes(i)?'emphasis':''}"><span>나방 ${i+1}</span><canvas width="150" height="100" data-guide-moth="${i}"></canvas><strong>${reveal?m.score.toFixed(1)+'%':'점수 ?'}</strong></div>`).join('')}</div>`;
}
function guideVisual(frame){
  const round=GUIDE_ROUNDS[frame.round],kind=frame.kind,showAfter=kind==='replace',pop=showAfter?round.childrenAfter:round.before;
  const selected=kind==='select'?round.parents:[],focus=round.focus,chosen=kind==='genome'||kind==='make'||kind==='evaluate'?round.before.reduce((best,m,i)=>m.score>round.before[best].score?i:best,0):focus;
  let extra='';
  if(kind==='genome'||kind==='make'||kind==='question'||kind==='evaluate'){
    const m=round.before[chosen];
    extra=`<div class="pattern-guide-detail"><div><h3>나방 ${chosen+1}의 설계도</h3><canvas id="guide-focus" width="250" height="140"></canvas>${kind==='evaluate'?`<p>평균 RGB 차이 <strong>${m.error.toFixed(2)}</strong> → 위장 점수 <strong>${m.score.toFixed(1)}%</strong></p>`:''}</div><div>${kind==='make'||kind==='question'?patternStagesMarkup():patternGeneRows(m)}</div></div>`;
  }else if(kind==='select'){
    extra=`<div class="guide-evidence"><h3>점수 → 선택 확률 → 부모</h3><div class="guide-probability">${round.before.map((m,i)=>`<div class="guide-prob-row ${selected.includes(i)?'chosen':''}"><span>나방 ${i+1}</span><strong>${m.score.toFixed(1)}%</strong><div><i style="width:${Math.min(100,round.weights[i]/round.total*380)}%"></i></div><b>${(round.weights[i]/round.total*100).toFixed(1)}%</b></div>`).join('')}</div><div class="guide-draws">${round.draws.map((d,j)=>`<p>부모 ${j?'B':'A'}: 난수 ${d.draw.toFixed(1)} ∈ [${d.low.toFixed(1)}, ${d.high.toFixed(1)}) → <strong>나방 ${d.index+1}</strong></p>`).join('')}</div></div>`;
  }else if(kind==='cross'||kind==='mutation'){
    const [a,b]=round.parents.map(i=>round.before[i]),before=round.childrenBefore[focus],after=round.childrenAfter[focus];
    extra=`<div class="guide-evidence"><h3>부모 A(${round.parents[0]+1}) + B(${round.parents[1]+1}) → 자손 ${focus+1}</h3>${patternInheritance(a,b,before,round.sources[focus],kind==='mutation'?after:null)}<div class="pattern-compare"><div><span>부모 A</span><canvas width="190" height="100" data-guide-compare="a"></canvas></div><div><span>부모 B</span><canvas width="190" height="100" data-guide-compare="b"></canvas></div><div><span>교차 직후</span><canvas width="190" height="100" data-guide-compare="before"></canvas></div>${kind==='mutation'?'<div><span>변이 후</span><canvas width="190" height="100" data-guide-compare="after"></canvas></div>':''}</div>${kind==='mutation'?`<p>변이된 유전자: ${after.mutations.map(j=>PATTERN_GENES[j].name).join(', ')||'없음'} · 점수 ${before.score.toFixed(1)}% → ${after.score.toFixed(1)}%</p>`:''}</div>`;
  }else if(kind==='replace'){
    extra=`<div class="guide-evidence"><h3>세대 변화</h3><div class="guide-result-metrics"><span>이전 최고 <strong>${Math.max(...round.before.map(m=>m.score)).toFixed(1)}%</strong></span><b>→</b><span>새 세대 최고 <strong>${Math.max(...round.childrenAfter.map(m=>m.score)).toFixed(1)}%</strong></span></div><p>이전 세대 최고였던 나방 ${round.eliteIndex+1}번을 변이 없이 보존했습니다.</p></div>`;
  }
  return `<div class="guide-scene"><div class="guide-scene-head"><div><span class="guide-kicker">PATTERN EVOLUTION</span><h2>${frame.round+1}번째 세대 · 같은 나무껍질</h2></div><div class="guide-target"><span>고정 배경</span><i style="background:${rgb(BARK[GUIDE_FOREST.base])}"></i><strong>${rgb(BARK[GUIDE_FOREST.base])}</strong></div></div>${guidePopulation(pop,selected,kind!=='intro'&&kind!=='question'&&kind!=='genome'&&kind!=='make')}${extra}</div>`;
}
function renderGuide(){
  const frames=guideFrames(),frame=frames[guideFrame];
  $('course-part-label').textContent=`PART ${String(guidePart).padStart(2,'0')} / 04`;
  $('tutorial-count').textContent=`장면 ${guideFrame+1} / ${frames.length}`;
  $('tutorial-visual').innerHTML=guideVisual(frame);
  $('tutorial-coach').innerHTML=`<div class="guide-coach"><span>${frame.tag}</span><h2>${frame.title}</h2><p>${frame.coach}</p><div>${frame.hint}</div></div>`;
  $('tutorial-prev').disabled=guideFrame===0;
  $('tutorial-next').textContent=guideFrame===frames.length-1?(guidePart===1?'2부로 이동 →':'3부 자세히 보기 →'):'다음 →';
  const pop=frame.kind==='replace'?GUIDE_ROUNDS[frame.round].childrenAfter:GUIDE_ROUNDS[frame.round].before;
  document.querySelectorAll('[data-guide-moth]').forEach(canvas=>paintPatternMoth(canvas.getContext('2d'),75,49,pop[Number(canvas.dataset.guideMoth)],.7,false,null));
  const focus=$('guide-focus');if(focus){const chosen=pop.reduce((best,m,i)=>m.score>pop[best].score?i:best,0);paintPatternMoth(focus.getContext('2d'),125,69,pop[chosen],1.2,false,null);}
  if(frame.kind==='make'||frame.kind==='question'){const chosen=pop.reduce((best,m,i)=>m.score>pop[best].score?i:best,0);drawPatternStages(pop[chosen]);}
  if(frame.kind==='cross'||frame.kind==='mutation'){
    const round=GUIDE_ROUNDS[frame.round],models={a:round.before[round.parents[0]],b:round.before[round.parents[1]],before:round.childrenBefore[round.focus],after:round.childrenAfter[round.focus]};
    document.querySelectorAll('[data-guide-compare]').forEach(canvas=>paintPatternMoth(canvas.getContext('2d'),95,49,models[canvas.dataset.guideCompare],.95,false,null));
  }
}
function showCoursePart(part){
  stopAuto();
  guidePart=part;$('tutorial-page').classList.toggle('hidden',part>2);$('lab-pages').classList.toggle('hidden',part<=2);
  for(let i=1;i<=4;i++)$('course-part-'+i).classList.toggle('active',i===part);
  $('course-part-label').textContent=`PART ${String(part).padStart(2,'0')} / 04`;
  if(part<=2)renderGuide();
  else{
    const deep=part===3;
    $('lab-part-label').textContent=deep?'PART 03 · DEEP DIVE':'PART 04 · YOUR TURN';
    $('lab-part-title').textContent=deep?'교차·변이의 계산을 따라가 보세요.':'이제 직접 진화시켜 보세요.';
    $('lab-part-description').textContent=deep?'한 장면씩 넘기며 부모의 숫자가 자손에게 전달되는 과정을 확인하세요.':'세대별 집단 변화를 관찰하고, 진화한 나방을 새 나무 배경에서 시험하세요.';
    showPage(deep?'learn':'experiment');
    if(!deep&&state.phase==='initial')step();
  }
}
for(let i=1;i<=4;i++)$('course-part-'+i).addEventListener('click',()=>{guideFrame=0;showCoursePart(i);});
$('tutorial-prev').addEventListener('click',()=>{if(guideFrame>0){guideFrame--;renderGuide();}});
$('tutorial-next').addEventListener('click',()=>{if(guideFrame<guideFrames().length-1){guideFrame++;renderGuide();}else{guideFrame=0;showCoursePart(Math.min(4,guidePart+1));}});
$('tutorial-reset').addEventListener('click',()=>{guideFrame=0;renderGuide();});
renderGuide();
