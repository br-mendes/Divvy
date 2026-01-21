"use strict";(()=>{var e={};e.id=6879,e.ids=[6879],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},12180:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>x,patchFetch:()=>h,requestAsyncStorage:()=>g,routeModule:()=>u,serverHooks:()=>f,staticGenerationAsyncStorage:()=>m});var o={};r.r(o),r.d(o,{POST:()=>c});var a=r(49303),i=r(88716),s=r(60670),n=r(87070),p=r(30474),d=r(78803),l=r(36119);async function c(e){try{let{divvyId:t,paidByUserId:r,amount:o,category:a,description:i,date:s,receiptPhotoUrl:c,splits:u}=await e.json();if(!t||!o||!a||!s||!u||0===u.length)return n.NextResponse.json({error:"Dados incompletos para criar despesa."},{status:400});let g=await (0,d.m)(e),m=(0,p.f)(),{data:f}=await m.from("divvymembers").select("id").eq("divvyid",t).eq("userid",g.id).single();if(!f)return n.NextResponse.json({error:"Voc\xea n\xe3o \xe9 membro deste grupo."},{status:403});let{data:x,error:h}=await m.from("expenses").insert({divvyid:t,paidbyuserid:r,amount:o,category:a,description:i,date:s,receiptphotourl:c,locked:!1}).select().single();if(h)throw h;let v=u.map(e=>({expenseid:x.id,participantuserid:e.participantuserid,amountowed:e.amountowed})),{error:y}=await m.from("expensesplits").insert(v);if(y)throw await m.from("expenses").delete().eq("id",x.id),y;let{data:b}=await m.from("divvies").select("name").eq("id",t).single(),{data:w}=await m.from("userprofiles").select("displayname, fullname").eq("id",r).single(),$=w?.displayname||w?.fullname||"Algu\xe9m",E=v.map(e=>e.participantuserid).filter(e=>e!==r),R=E.map(e=>({user_id:e,divvy_id:t,type:"expense",title:"Nova Despesa",message:`${$} adicionou: ${i} (R$ ${o.toFixed(2)})`,created_at:new Date().toISOString(),is_read:!1}));R.length>0&&await m.from("notifications").insert(R);let{data:_}=await m.from("userprofiles").select("email").in("id",E);if(_)for(let e of _)e.email&&await (0,l.hx)(e.email,b?.name||"Grupo",o.toFixed(2),i,$);return n.NextResponse.json({expense:x},{status:201})}catch(e){if("Unauthorized"===e.message)return n.NextResponse.json({error:"N\xe3o autorizado"},{status:401});return console.error("Create Expense Error:",e),n.NextResponse.json({error:e.message},{status:500})}}let u=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/expenses/route",pathname:"/api/expenses",filename:"route",bundlePath:"app/api/expenses/route"},resolvedPagePath:"C:\\Users\\bruno\\Documents\\GitHub\\Divvy\\app\\api\\expenses\\route.ts",nextConfigOutput:"export",userland:o}),{requestAsyncStorage:g,staticGenerationAsyncStorage:m,serverHooks:f}=u,x="/api/expenses/route";function h(){return(0,s.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:m})}},36119:(e,t,r)=>{r.d(t,{F1:()=>p,J2:()=>d,hx:()=>s,j1:()=>n,sI:()=>i});var o=r(30805);async function a(e){try{let t=`${(0,o.A)()}/api/send-email`,r=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),a=await r.json();if(!r.ok)throw Error(a.error||"Error sending email");return a}catch(e){throw console.error("Email sending failed:",e),e}}async function i(e,t,r,o,i){let s=`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: #7c3aed; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .content { padding: 40px 30px; text-align: center; }
          .content p { font-size: 16px; color: #4b5563; margin-bottom: 24px; }
          .button { display: inline-block; padding: 14px 28px; background: #7c3aed; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background 0.2s; }
          .button:hover { background: #6d28d9; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
          .qr-container { margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 12px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Voc\xea foi convidado! 🎉</h1>
          </div>
          <div class="content">
            <p>Ol\xe1!</p>
            <p><strong>${r}</strong> convidou voc\xea para participar do grupo de despesas <strong>"${t}"</strong> no Divvy.</p>
            
            <a href="${o}" class="button">Aceitar Convite</a>
            
            ${i?`
              <div style="margin-top: 30px;">
                <p style="font-size: 14px; margin-bottom: 10px;">Ou escaneie com seu celular:</p>
                <div class="qr-container">
                  <img src="${i}" width="150" height="150" alt="QR Code" style="display: block;" />
                </div>
              </div>
            `:""}
            
            <p style="font-size: 12px; margin-top: 30px;">Este link expira em 7 dias.</p>
          </div>
          <div class="footer">
            <p>\xa9 2026 Divvy. Gest\xe3o inteligente de despesas.</p>
          </div>
        </div>
      </body>
    </html>
  `;return await a({to:e,subject:`${r} convidou voc\xea para ${t} no Divvy`,html:s})}async function s(e,t,r,o,i){let s=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #1f2937;">Nova despesa em ${t} 💸</h2>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Valor:</strong> <span style="font-size: 18px; color: #059669;">R$ ${r}</span></p>
        <p style="margin: 5px 0;"><strong>Descri\xe7\xe3o:</strong> ${o}</p>
        <p style="margin: 5px 0;"><strong>Pago por:</strong> ${i}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Acesse o app para ver os detalhes e seu saldo atualizado.</p>
    </div>
  `;return await a({to:e,subject:`Nova despesa de R$ ${r} em ${t}`,html:s})}async function n(e,t,r,o){let i=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937;">Pagamento Enviado 💰</h2>
      <p><strong>${t}</strong> marcou um pagamento de <strong>R$ ${r}</strong> para voc\xea no grupo <strong>${o}</strong>.</p>
      <p>Por favor, verifique se recebeu o valor e confirme no app.</p>
      <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; color: #92400e;">
        Acesse o Divvy para confirmar ou recusar.
      </div>
    </div>
  `;return await a({to:e,subject:`${t} enviou R$ ${r} no Divvy`,html:i})}async function p(e,t,r,o){let i=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #059669;">Pagamento Confirmado ✅</h2>
      <p><strong>${t}</strong> confirmou o recebimento do seu pagamento de <strong>R$ ${r}</strong> no grupo <strong>${o}</strong>.</p>
      <p>Sua d\xedvida foi atualizada.</p>
    </div>
  `;return await a({to:e,subject:`Pagamento de R$ ${r} confirmado por ${t}`,html:i})}async function d(e,t,r,o){let i=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626;">Pagamento Recusado ❌</h2>
      <p><strong>${t}</strong> recusou seu registro de pagamento de <strong>R$ ${r}</strong> no grupo <strong>${o}</strong>.</p>
      <p>Entre em contato com o membro para resolver a pend\xeancia.</p>
    </div>
  `;return await a({to:e,subject:`Pagamento de R$ ${r} recusado por ${t}`,html:i})}},30805:(e,t,r)=>{r.d(t,{A:()=>o});let o=()=>{let e=process.env.NEXT_PUBLIC_SITE_URL||process.env.NEXT_PUBLIC_VERCEL_URL||"http://localhost:3000";return(e=e.startsWith("http")?e:`https://${e}`).replace(/\/$/,"")}},78803:(e,t,r)=>{r.d(t,{m:()=>s});var o=r(37857);let a="https://jpgifiumxqzbroejhudc.supabase.co",i="sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi";if(!a)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!i)throw Error("Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY");async function s(e){let t=e.headers.get("authorization")?.split(" ")[1];if(!t)throw Error("Unauthorized");let r=(0,o.eI)(a,i),{data:{user:s},error:n}=await r.auth.getUser(t);if(n||!s)throw Error("Unauthorized");return s}},30474:(e,t,r)=>{r.d(t,{f:()=>s});var o=r(37857);let a="https://jpgifiumxqzbroejhudc.supabase.co",i=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!a)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!i)throw Error("Missing env SUPABASE_SERVICE_ROLE_KEY");let s=()=>(0,o.eI)(a,i,{auth:{autoRefreshToken:!1,persistSession:!1}})}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[9276,5972,7857],()=>r(12180));module.exports=o})();