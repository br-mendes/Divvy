"use strict";(()=>{var e={};e.id=7979,e.ids=[7979],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},92586:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>x,patchFetch:()=>h,requestAsyncStorage:()=>g,routeModule:()=>u,serverHooks:()=>f,staticGenerationAsyncStorage:()=>m});var o={};a.r(o),a.d(o,{POST:()=>c});var r=a(49303),n=a(88716),i=a(60670),s=a(87070),d=a(30474),p=a(78803),l=a(36119);async function c(e){try{let{divvyId:t,fromUserId:a,toUserId:o,amount:r}=await e.json(),n=await (0,p.m)(e),i=(0,d.f)();if(n.id!==a)return s.NextResponse.json({error:"Voc\xea s\xf3 pode registrar pagamentos que voc\xea enviou."},{status:403});let{data:c,error:u}=await i.from("transactions").insert({divvyid:t,fromuserid:a,touserid:o,amount:r,status:"paymentsent",createdat:new Date().toISOString(),updatedat:new Date().toISOString()}).select().single();if(u)throw u;let{data:g}=await i.from("userprofiles").select("email").eq("id",o).single(),{data:m}=await i.from("userprofiles").select("fullname, displayname").eq("id",a).single(),{data:f}=await i.from("divvies").select("name").eq("id",t).single(),x=m?.displayname||m?.fullname||"Algu\xe9m";return await i.from("notifications").insert({user_id:o,divvy_id:t,type:"settlement",title:"Pagamento Recebido",message:`${x} marcou um pagamento de R$ ${r.toFixed(2)} como enviado.`,created_at:new Date().toISOString(),is_read:!1}),g?.email&&await (0,l.j1)(g.email,x,r.toFixed(2),f?.name||"Grupo"),s.NextResponse.json({success:!0,transaction:c},{status:200})}catch(e){if("Unauthorized"===e.message)return s.NextResponse.json({error:"N\xe3o autorizado"},{status:401});return console.error("Mark Sent Error:",e),s.NextResponse.json({error:e.message},{status:500})}}let u=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/payments/mark-sent/route",pathname:"/api/payments/mark-sent",filename:"route",bundlePath:"app/api/payments/mark-sent/route"},resolvedPagePath:"C:\\Users\\bruno\\Documents\\GitHub\\Divvy\\app\\api\\payments\\mark-sent\\route.ts",nextConfigOutput:"export",userland:o}),{requestAsyncStorage:g,staticGenerationAsyncStorage:m,serverHooks:f}=u,x="/api/payments/mark-sent/route";function h(){return(0,i.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:m})}},36119:(e,t,a)=>{a.d(t,{F1:()=>d,J2:()=>p,hx:()=>i,j1:()=>s,sI:()=>n});var o=a(30805);async function r(e){try{let t=`${(0,o.A)()}/api/send-email`,a=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),r=await a.json();if(!a.ok)throw Error(r.error||"Error sending email");return r}catch(e){throw console.error("Email sending failed:",e),e}}async function n(e,t,a,o,n){let i=`
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
            
            ${n?`
              <div style="margin-top: 30px;">
                <p style="font-size: 14px; margin-bottom: 10px;">Ou escaneie com seu celular:</p>
                <div class="qr-container">
                  <img src="${n}" width="150" height="150" alt="QR Code" style="display: block;" />
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
  `;return await r({to:e,subject:`${a} convidou voc\xea para ${t} no Divvy`,html:i})}async function i(e,t,a,o,n){let i=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #1f2937;">Nova despesa em ${t} 💸</h2>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Valor:</strong> <span style="font-size: 18px; color: #059669;">R$ ${a}</span></p>
        <p style="margin: 5px 0;"><strong>Descri\xe7\xe3o:</strong> ${o}</p>
        <p style="margin: 5px 0;"><strong>Pago por:</strong> ${n}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Acesse o app para ver os detalhes e seu saldo atualizado.</p>
    </div>
  `;return await r({to:e,subject:`Nova despesa de R$ ${a} em ${t}`,html:i})}async function s(e,t,a,o){let n=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937;">Pagamento Enviado 💰</h2>
      <p><strong>${t}</strong> marcou um pagamento de <strong>R$ ${a}</strong> para voc\xea no grupo <strong>${o}</strong>.</p>
      <p>Por favor, verifique se recebeu o valor e confirme no app.</p>
      <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; color: #92400e;">
        Acesse o Divvy para confirmar ou recusar.
      </div>
    </div>
  `;return await r({to:e,subject:`${t} enviou R$ ${a} no Divvy`,html:n})}async function d(e,t,a,o){let n=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #059669;">Pagamento Confirmado ✅</h2>
      <p><strong>${t}</strong> confirmou o recebimento do seu pagamento de <strong>R$ ${a}</strong> no grupo <strong>${o}</strong>.</p>
      <p>Sua d\xedvida foi atualizada.</p>
    </div>
  `;return await r({to:e,subject:`Pagamento de R$ ${a} confirmado por ${t}`,html:n})}async function p(e,t,a,o){let n=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626;">Pagamento Recusado ❌</h2>
      <p><strong>${t}</strong> recusou seu registro de pagamento de <strong>R$ ${a}</strong> no grupo <strong>${o}</strong>.</p>
      <p>Entre em contato com o membro para resolver a pend\xeancia.</p>
    </div>
  `;return await r({to:e,subject:`Pagamento de R$ ${a} recusado por ${t}`,html:n})}},30805:(e,t,a)=>{a.d(t,{A:()=>o});let o=()=>{let e=process.env.NEXT_PUBLIC_SITE_URL||process.env.NEXT_PUBLIC_VERCEL_URL||"http://localhost:3000";return(e=e.startsWith("http")?e:`https://${e}`).replace(/\/$/,"")}},78803:(e,t,a)=>{a.d(t,{m:()=>i});var o=a(37857);let r="https://jpgifiumxqzbroejhudc.supabase.co",n="sb_publishable_RWrlgQRxQHCQ45cEIia_ug_OT9ouCwi";if(!r)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!n)throw Error("Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY");async function i(e){let t=e.headers.get("authorization")?.split(" ")[1];if(!t)throw Error("Unauthorized");let a=(0,o.eI)(r,n),{data:{user:i},error:s}=await a.auth.getUser(t);if(s||!i)throw Error("Unauthorized");return i}},30474:(e,t,a)=>{a.d(t,{f:()=>i});var o=a(37857);let r="https://jpgifiumxqzbroejhudc.supabase.co",n=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!r)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!n)throw Error("Missing env SUPABASE_SERVICE_ROLE_KEY");let i=()=>(0,o.eI)(r,n,{auth:{autoRefreshToken:!1,persistSession:!1}})}};var t=require("../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),o=t.X(0,[9276,5972,7857],()=>a(92586));module.exports=o})();