(function(){'use strict';
  const s=document.currentScript;
  const token=s&&s.getAttribute('data-token');
  const plan=(s&&s.getAttribute('data-plan'))||'starter';
  const api=(s&&s.getAttribute('data-api'))||window.location.origin;
  if(!token){console.warn('[SmartCompliance] No token. Widget not loaded.');return;}
  fetch(api+'/api/verify/'+token,{method:'GET',cache:'no-store'})
    .then(r=>r.json()).then(d=>{if(d.active===true){injectStyles();buildWidget(plan);}else{console.info('[SmartCompliance] Not active:',d.reason);}})
    .catch(()=>console.warn('[SmartCompliance] Verify unreachable.'));

  const CATS=[
    {id:'patient_documentation',label:'\uD83D\uDCCB Patient Documentation',items:['OASIS assessments completed within required timeframe','Plan of Care (485) signed by physician before services begin','Comprehensive patient assessment on file and current','Consent forms signed and documented','Patient rights acknowledgment on file']},
    {id:'care_plans',label:'\uD83E\uDE7A Care Plans & Visit Notes',items:['Visit notes completed within 24 hours of visit','Care plan goals documented and measurable','Physician orders current and signed','Interdisciplinary team communication documented','Discharge planning initiated when appropriate']},
    {id:'staff_credentials',label:'\uD83D\uDC69\u200D\u2695\uFE0F Staff Credentials & Training',items:['Active license on file for all clinical staff','Background checks completed for all employees','Annual competency evaluations on file','HIPAA training completed and documented','CPR certification current for all clinical staff','Orientation checklist completed for new hires']},
    {id:'billing_coding',label:'\uD83D\uDCB3 Billing & Coding',items:['ICD-10 codes accurate and supported by documentation','HHRG/PDGM grouping verified against documentation','Medicare eligibility confirmed prior to admission','RAP/Final claim submission within timely filing limits','Overpayment policies and procedures in place']},
    {id:'infection_control',label:'\uD83E\uDDA0 Infection Control',items:['Infection control policy reviewed annually','PPE supply adequate and accessible','Bloodborne pathogen training current','Hand hygiene protocol documented and trained','Exposure control plan in place']},
    {id:'emergency_preparedness',label:'\uD83D\uDEA8 Emergency Preparedness',items:['Emergency preparedness plan current','Patient emergency contact information on file','Staff emergency contact list maintained','Continuity of care plan for disaster scenarios','Emergency preparedness training documented']},
  ];
  const LIMITS={starter:{n:2,label:'Starter'},professional:{n:4,label:'Professional'},enterprise:{n:6,label:'Enterprise'}};

  function buildWidget(plan){
    if(document.getElementById('sc-root'))return;
    const lim=LIMITS[plan]||LIMITS.starter;
    const cats=CATS.slice(0,lim.n);
    const state={}; cats.forEach(c=>{state[c.id]={};}); 
    const btn=document.createElement('button');btn.id='sc-trigger';btn.innerHTML='\u2705 Compliance Audit';document.body.appendChild(btn);
    const panel=document.createElement('div');panel.id='sc-root';panel.innerHTML=buildHTML(cats,lim);document.body.appendChild(panel);
    let open=false;
    btn.addEventListener('click',()=>{open=!open;panel.style.transform=open?'translateX(0)':'translateX(110%)';btn.style.display=open?'none':'flex';});
    panel.querySelector('#sc-close').addEventListener('click',()=>{open=false;panel.style.transform='translateX(110%)';btn.style.display='flex';});
    panel.addEventListener('change',e=>{if(e.target.type!=='checkbox')return;const{cat,idx}=e.target.dataset;state[cat][idx]=e.target.checked;updateScore(panel,state,cats);});
  }

  function buildHTML(cats,lim){
    return '<div class="sc-header"><div class="sc-ht"><span class="sc-logo">\u2705 Smart Compliance</span><button id="sc-close">\u2715</button></div>'+
      '<div class="sc-overall"><div class="sc-lbl">Overall Compliance Score</div><div class="sc-big" id="sc-pct">0%</div>'+
      '<div class="sc-bar"><div class="sc-fill" id="sc-fill" style="width:0%"></div></div>'+
      '<div class="sc-badge">'+lim.label+' \u00B7 '+cats.length+' categories</div></div></div>'+
      '<div class="sc-body">'+cats.map(c=>'<div class="sc-cat"><div class="sc-ch"><span>'+c.label+'</span><span class="sc-cs" id="cs-'+c.id+'">0/'+c.items.length+'</span></div>'+
      '<ul>'+c.items.map((item,i)=>'<li><label><input type="checkbox" data-cat="'+c.id+'" data-idx="'+i+'" /><span>'+item+'</span></label></li>').join('')+'</ul></div>').join('')+'</div>'+
      '<div class="sc-foot"><button onclick="window.print()">\uD83D\uDDA8\uFE0F Print</button><span>Powered by Smart Compliance</span></div>';
  }

  function updateScore(panel,state,cats){
    let tot=0,chk=0;
    cats.forEach(c=>{const n=Object.values(state[c.id]).filter(Boolean).length;const t=c.items.length;chk+=n;tot+=t;const el=panel.querySelector('#cs-'+c.id);if(el)el.textContent=n+'/'+t;});
    const p=tot?Math.round(chk/tot*100):0;
    const pe=panel.querySelector('#sc-pct'),fe=panel.querySelector('#sc-fill');
    if(pe){pe.textContent=p+'%';pe.style.color=p>=80?'#10b981':p>=50?'#f59e0b':'#ef4444';}
    if(fe)fe.style.width=p+'%';
  }

  function injectStyles(){
    if(document.getElementById('sc-styles'))return;
    const st=document.createElement('style');st.id='sc-styles';
    st.textContent='#sc-trigger{position:fixed;bottom:24px;right:24px;z-index:99998;background:#0f172a;color:#fff;border:none;cursor:pointer;padding:12px 20px;border-radius:50px;font-size:14px;font-family:Inter,sans-serif;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.3);display:flex;align-items:center;gap:8px;}'+
    '#sc-root{position:fixed;top:0;right:0;width:420px;height:100vh;background:#fff;z-index:99999;display:flex;flex-direction:column;box-shadow:-4px 0 30px rgba(0,0,0,.15);font-family:Inter,sans-serif;font-size:14px;transform:translateX(110%);transition:transform .3s ease;overflow:hidden;}'+
    '.sc-header{background:#0f172a;color:#fff;padding:20px;flex-shrink:0;}.sc-ht{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}'+
    '.sc-logo{font-weight:700;font-size:16px;}#sc-close{background:none;border:none;color:#fff;font-size:18px;cursor:pointer;}'+
    '.sc-overall{text-align:center;}.sc-lbl{font-size:12px;color:#94a3b8;margin-bottom:4px;}.sc-big{font-size:48px;font-weight:800;color:#fff;line-height:1;margin-bottom:12px;}'+
    '.sc-bar{background:#1e293b;border-radius:99px;height:8px;margin-bottom:10px;}.sc-fill{height:8px;border-radius:99px;background:#10b981;transition:width .4s ease;}'+
    '.sc-badge{font-size:11px;color:#64748b;background:#1e293b;display:inline-block;padding:4px 12px;border-radius:99px;}'+
    '.sc-body{flex:1;overflow-y:auto;padding:16px;}.sc-cat{margin-bottom:16px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;}'+
    '.sc-ch{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#f8fafc;font-weight:600;font-size:13px;}'+
    '.sc-cs{font-size:12px;color:#6366f1;background:#eef2ff;padding:2px 8px;border-radius:99px;}'+
    'ul{list-style:none;margin:0;padding:0;}li{border-top:1px solid #f1f5f9;}label{display:flex;align-items:flex-start;gap:10px;padding:10px 16px;cursor:pointer;}'+
    'label input{margin-top:2px;accent-color:#6366f1;width:16px;height:16px;flex-shrink:0;}label span{color:#374151;line-height:1.5;}label input:checked+span{color:#10b981;text-decoration:line-through;}'+
    '.sc-foot{border-top:1px solid #e2e8f0;padding:14px 16px;display:flex;justify-content:space-between;align-items:center;background:#f8fafc;flex-shrink:0;}'+
    '.sc-foot button{background:#0f172a;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;}'+
    '.sc-foot span{font-size:11px;color:#94a3b8;}';
    document.head.appendChild(st);
  }
})();
