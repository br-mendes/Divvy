"use strict";(()=>{var e={};e.id=7421,e.ids=[7421],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},74184:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>f,patchFetch:()=>v,requestAsyncStorage:()=>u,routeModule:()=>l,serverHooks:()=>g,staticGenerationAsyncStorage:()=>m});var o={};a.r(o),a.d(o,{POST:()=>c});var r=a(49303),i=a(88716),n=a(60670),s=a(87070),d=a(30474),p=a(36119);async function c(e){try{let t=(0,d.f)(),{transactionId:a,userId:o}=await e.json(),{data:r,error:i}=await t.from("transactions").select("*").eq("id",a).single();if(i||!r)throw Error("Transa\xe7\xe3o n\xe3o encontrada");if(r.touserid!==o)return s.NextResponse.json({error:"Apenas o recebedor pode confirmar."},{status:403});let n=new Date().toISOString(),{error:c}=await t.from("transactions").update({status:"confirmed",paidat:n,updatedat:n}).eq("id",a);if(c)throw c;let{data:l}=await t.from("userprofiles").select("email").eq("id",r.fromuserid).single(),{data:u}=await t.from("userprofiles").select("fullname, displayname").eq("id",r.touserid).single(),{data:m}=await t.from("divvies").select("name").eq("id",r.divvyid).single(),g=u?.displayname||u?.fullname||"Credor";await t.from("notifications").insert({user_id:r.fromuserid,divvy_id:r.divvyid,type:"settlement",title:"Pagamento Confirmado",message:`${g} confirmou seu pagamento de R$ ${r.amount.toFixed(2)}.`,created_at:new Date().toISOString(),is_read:!1}),l?.email&&await (0,p.F1)(l.email,g,r.amount.toFixed(2),m?.name||"Grupo");let{data:f}=await t.from("transactions").select("status, paidat").eq("divvyid",r.divvyid);if(f?.every(e=>"confirmed"===e.status||"rejected"===e.status)&&f&&f.length>0){let e=f.filter(e=>"confirmed"===e.status).map(e=>new Date(e.paidat).getTime());e.push(new Date(n).getTime());let a=new Date(Math.max(...e)).toISOString();await t.from("divvies").update({lastglobalconfirmationat:a,archivesuggested:!0,archivesuggestedat:new Date().toISOString()}).eq("id",r.divvyid),await t.from("expenses").update({locked:!0,lockedreason:"Bloqueio autom\xe1tico: Todas as d\xedvidas quitadas.",lockedat:new Date().toISOString()}).eq("divvyid",r.divvyid).lte("date",a).eq("locked",!1),console.log(`[Divvy ${r.divvyid}] Fechamento de caixa realizado em ${a}`)}return s.NextResponse.json({success:!0},{status:200})}catch(e){return console.error("Confirm Payment Error:",e),s.NextResponse.json({error:e.message},{status:500})}}let l=new r.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/payments/confirm/route",pathname:"/api/payments/confirm",filename:"route",bundlePath:"app/api/payments/confirm/route"},resolvedPagePath:"C:\\Users\\bruno\\Documents\\GitHub\\Divvy\\app\\api\\payments\\confirm\\route.ts",nextConfigOutput:"export",userland:o}),{requestAsyncStorage:u,staticGenerationAsyncStorage:m,serverHooks:g}=l,f="/api/payments/confirm/route";function v(){return(0,n.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:m})}},36119:(e,t,a)=>{a.d(t,{F1:()=>d,J2:()=>p,hx:()=>n,j1:()=>s,sI:()=>i});var o=a(30805);async function r(e){try{let t=`${(0,o.A)()}/api/send-email`,a=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),r=await a.json();if(!a.ok)throw Error(r.error||"Error sending email");return r}catch(e){throw console.error("Email sending failed:",e),e}}async function i(e,t,a,o,i){let n=`
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
            <p><strong>${a}</strong> convidou voc\xea para participar do grupo de despesas <strong>"${t}"</strong> no Divvy.</p>
            
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
  `;return await r({to:e,subject:`${a} convidou voc\xea para ${t} no Divvy`,html:n})}async function n(e,t,a,o,i){let n=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #1f2937;">Nova despesa em ${t} 💸</h2>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Valor:</strong> <span style="font-size: 18px; color: #059669;">R$ ${a}</span></p>
        <p style="margin: 5px 0;"><strong>Descri\xe7\xe3o:</strong> ${o}</p>
        <p style="margin: 5px 0;"><strong>Pago por:</strong> ${i}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Acesse o app para ver os detalhes e seu saldo atualizado.</p>
    </div>
  `;return await r({to:e,subject:`Nova despesa de R$ ${a} em ${t}`,html:n})}async function s(e,t,a,o){let i=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937;">Pagamento Enviado 💰</h2>
      <p><strong>${t}</strong> marcou um pagamento de <strong>R$ ${a}</strong> para voc\xea no grupo <strong>${o}</strong>.</p>
      <p>Por favor, verifique se recebeu o valor e confirme no app.</p>
      <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; color: #92400e;">
        Acesse o Divvy para confirmar ou recusar.
      </div>
    </div>
  `;return await r({to:e,subject:`${t} enviou R$ ${a} no Divvy`,html:i})}async function d(e,t,a,o){let i=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #059669;">Pagamento Confirmado ✅</h2>
      <p><strong>${t}</strong> confirmou o recebimento do seu pagamento de <strong>R$ ${a}</strong> no grupo <strong>${o}</strong>.</p>
      <p>Sua d\xedvida foi atualizada.</p>
    </div>
  `;return await r({to:e,subject:`Pagamento de R$ ${a} confirmado por ${t}`,html:i})}async function p(e,t,a,o){let i=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626;">Pagamento Recusado ❌</h2>
      <p><strong>${t}</strong> recusou seu registro de pagamento de <strong>R$ ${a}</strong> no grupo <strong>${o}</strong>.</p>
      <p>Entre em contato com o membro para resolver a pend\xeancia.</p>
    </div>
  `;return await r({to:e,subject:`Pagamento de R$ ${a} recusado por ${t}`,html:i})}},30805:(e,t,a)=>{a.d(t,{A:()=>o});let o=()=>{let e=process.env.NEXT_PUBLIC_SITE_URL||process.env.NEXT_PUBLIC_VERCEL_URL||"http://localhost:3000";return(e=e.startsWith("http")?e:`https://${e}`).replace(/\/$/,"")}},30474:(e,t,a)=>{a.d(t,{f:()=>n});var o=a(37857);let r="https://jpgifiumxqzbroejhudc.supabase.co",i=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!r)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!i)throw Error("Missing env SUPABASE_SERVICE_ROLE_KEY");let n=()=>(0,o.eI)(r,i,{auth:{autoRefreshToken:!1,persistSession:!1}})}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),o=t.X(0,[9276,5972,7857],()=>a(74184));module.exports=o})();