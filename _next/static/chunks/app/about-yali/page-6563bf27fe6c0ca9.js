(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[946],{3710:function(e,t,a){Promise.resolve().then(a.t.bind(a,8517,23)),Promise.resolve().then(a.bind(a,1347)),Promise.resolve().then(a.t.bind(a,3855,23))},6814:function(e){"use strict";e.exports=function(e){let{src:t,width:a,quality:i}=e;if(t.startsWith("http://")||t.startsWith("https://")||t.startsWith("data:"))return t;let n="https://yali.vc".concat(t.startsWith("/")?"":"/").concat(t),s=new URLSearchParams;return a&&s.append("w",a),i&&s.append("q",i),s.toString()?"".concat(n,"?").concat(s.toString()):n}},291:function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"RouterContext",{enumerable:!0,get:function(){return i}});let i=a(9920)._(a(2265)).default.createContext(null)},1347:function(e,t,a){"use strict";a.d(t,{TeamDetails:function(){return f}});var i=a(7437),n=a(2265),s=a(6648),r=a(5296),o=a(5290),l=a(7376),d=a.n(l),c=a(1693),u=a(6814),h=a.n(u);let m=()=>{let[e,t]=(0,n.useState)(!1);return(0,n.useEffect)(()=>{let e=()=>{t(window.innerWidth<=800)};return e(),window.addEventListener("resize",e),()=>window.removeEventListener("resize",e)},[]),e},p=e=>{let{member:t}=e,a=m(),[r,o]=(0,n.useState)(t.image),[l,u]=(0,n.useState)(!1);return(0,n.useEffect)(()=>{console.log("Original image path:",t.image),console.log("Processed image path:",h()({src:t.image,width:400}))},[t.image]),(0,i.jsxs)("div",{className:d().teamMember,children:[(0,i.jsxs)("div",{className:d().memberInfo,children:[(0,i.jsxs)("header",{className:d().header,children:[a?(0,i.jsx)("h2",{className:d().name,children:t.Name}):(0,i.jsx)("p",{className:d().name,children:t.Name}),(0,i.jsx)("p",{className:d().designation,children:t.Designation})]}),(0,i.jsx)("p",{className:d().bio,children:t.Detailed||t["One-Liner"]}),(0,i.jsx)("div",{className:d().viewmoreButton,children:t.linkedin&&(0,i.jsx)(c.Z,{href:t.linkedin,color:"black",children:"view on linkedin"})})]}),(0,i.jsx)("div",{className:d().memberImage,children:l?(0,i.jsx)("div",{children:"Image failed to load"}):(0,i.jsx)(s.default,{loader:h(),src:t.image,alt:t.Name,width:400,height:400,style:{objectFit:"cover"},onError:()=>{console.error("Image failed to load:",t.image),u(!0)}})})]})},g=()=>{let{data:e}=(0,r.e)(),[t,a]=(0,n.useState)(4),[s,l]=(0,n.useState)(o["Team Members"].slice(0,4));return(0,n.useEffect)(()=>{if(e&&"success"===e.status&&e.data&&Array.isArray(e.data["Team Members"])){let t=e.data["Team Members"].filter(e=>e.Order>4);l(e=>[...e,...t])}},[e]),(0,i.jsxs)("div",{className:d().teamListContainer,children:[s.slice(0,t).map((e,t)=>(0,i.jsx)(p,{member:e},t)),t<s.length&&(0,i.jsx)("button",{className:d().loadMore,onClick:()=>{a(e=>Math.min(e+4,s.length))},children:"LOAD MORE"})]})},f=()=>(0,i.jsx)(g,{})},1693:function(e,t,a){"use strict";a.d(t,{Z:function(){return o}});var i=a(7437),n=a(1616),s=a.n(n);let r=()=>(0,i.jsx)("svg",{width:"14",height:"15",viewBox:"0 0 14 15",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:(0,i.jsx)("path",{"fill-rule":"evenodd","clip-rule":"evenodd",d:"M11.8137 1.73959H4.70711V0.739594H12.7071H13.2071V1.23959V9.23959H12.2071V2.76041L0.707108 14.2604L0 13.5533L11.8137 1.73959Z",fill:"white"})});function o(e){let{href:t,children:a,color:n="#000000"}=e;return(0,i.jsxs)("a",{href:t,className:s().button,style:{color:n},children:[(0,i.jsx)("span",{className:s().text,children:a}),(0,i.jsx)(r,{})]})}},5296:function(e,t,a){"use strict";a.d(t,{DataProvider:function(){return d},e:function(){return c}});var i=a(7437),n=a(2265),s=a(1628),r=a(930),o=a(5290);let l=(0,n.createContext)(null);function d(e){let{children:t,useLocalOnly:a=!1}=e,[d,c]=(0,n.useState)({companies:s,news:r,team:o}),[u,h]=(0,n.useState)(!1),[m,p]=(0,n.useState)(null),g=(0,n.useRef)(!1);return(0,n.useEffect)(()=>{async function e(){if(a){console.log("Using local data only");return}if(g.current){console.log("Data already fetched, skipping");return}h(!0);try{console.log("Fetching data...");let e=await fetch("https://script.googleusercontent.com/macros/echo?user_content_key=wMwqmD3hyEfjuyzrmit9jSDCLn5xdX1dHEGRoaIRU6my1Wo8PMkPxs98lDD7aWYsb4e6JeD_-mz3WDdMRgeUiCS1qgMJ1hhYm5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnO7Olp7pqFy3TogCoZyFUbirTpo2gKpFMxR5S6ehinpBH3e6cC_4M7e1OIWPPuzQWGgZZi-ESOrh77Vl3ZGmdGSdJoCw8JvXDg&lib=MmHDKL-d2iWmU93zHCQ7t4_c2JwAnkCxa");if(!e.ok)throw Error("Network response was not ok");let t=await e.json();console.log("Fetched data:",t),c(t),g.current=!0}catch(e){console.error("Error fetching data:",e),p(e)}finally{h(!1)}}return a||e(),()=>{console.log("DataProvider unmounting")}},[a]),(0,i.jsx)(l.Provider,{value:{data:d,loading:u,error:m},children:t})}function c(){let e=(0,n.useContext)(l);if(void 0===e)throw Error("useData must be used within a DataProvider");return e}},8517:function(e){e.exports={mainAbout:"about_styles_mainAbout__R_dcl",sectionLevel:"about_styles_sectionLevel__aX1zR",textContent:"about_styles_textContent__3Z9QK",paraFlex:"about_styles_paraFlex__OeEoJ",mainsecGraphic:"about_styles_mainsecGraphic__erhbS",people:"about_styles_people__XDzVd"}},7376:function(e){e.exports={teamListContainer:"detail_styles_teamListContainer__Yd7im",teamMember:"detail_styles_teamMember__kLPse",memberInfo:"detail_styles_memberInfo__UF_98",header:"detail_styles_header__ATVWH",name:"detail_styles_name__kbMwu",designation:"detail_styles_designation__EWuqt",viewmoreButton:"detail_styles_viewmoreButton__MILNR",bio:"detail_styles_bio__i3Sqs",getInTouch:"detail_styles_getInTouch__CjGyC",memberImage:"detail_styles_memberImage__9fKoa",loadMore:"detail_styles_loadMore__4KKnt"}},1616:function(e){e.exports={button:"button_button__Y1Z1D",text:"button_text__MJd3e"}},3855:function(e){e.exports={headerFlexWrapper:"headerflex_headerFlexWrapper__CNuit",headerFlex:"headerflex_headerFlex__ieNot",desktopMaxWidth:"headerflex_desktopMaxWidth__W6in4"}},1628:function(e){"use strict";e.exports=JSON.parse('{"data":[{"name":"4baseCare","category":"genomics","oneLiner":"Advanced genomics through 4baseCare\'s innovative precision oncology solutions.","detail":"4baseCare is a pioneering company in the field of precision oncology, dedicated to developing innovative solutions that combine advanced genomics with next-generation digital health technology. Their primary focus is on personalizing patient care in oncology through the creation of comprehensive genomic panels. These specialized panels empower oncologists to make informed decisions, enabling them to select the most effective targeted therapies for their patients. By bridging the gap between cutting-edge genomic research and practical clinical applications, 4baseCare aims to significantly improve treatment outcomes and quality of life for cancer patients.","link":"https://4basecare.com/"},{"name":"Perceptyne","category":"robotics","oneLiner":"Full-stack robotics platform for automating dextrous tasks.","detail":"Founded by Raviteja Chivukula, Jagga Raju N and Mrutyunjaya Sastry, Perceptyne is an AI-first robotics platform developing dexterous, affordable and contextually aware robots. Its flagship products include dual-arm and single-arm robots named PR-34D and PR-9D, ushering in a revolution in automated assembly in Electronics and Automobile Industries","link":"https://www.perceptyne.com/"}]}')},930:function(e){"use strict";e.exports=JSON.parse('{"status":"success","data":{"articles":[{"url":"https://inc42.com/buzz/robotics-startup-perceptyne-bags-3-mn-from-endiya-partners-yali-capital-others/","date":"2024-10-14T00:00:00.000Z","publicationName":"Inc42","headlineEdited":"Robotics Startup Perceptyne Bags $3 Mn From Endiya Partners, Yali Capital & Others","isVideo":false},{"url":"https://www.business-standard.com/companies/start-ups/ai-focused-robotic-startup-perceptyne-secures-3-million-in-seed-funding-124101400488_1.html","date":"2024-10-14T00:00:00.000Z","publicationName":"Business Standard","headlineEdited":"AI focused robotic startup Perceptyne secures $3 million in seed funding","isVideo":false},{"url":"https://yourstory.com/2024/10/startup-news-updates-daily-roundup-october-14-funding-robotics","date":"2024-10-14T00:00:00.000Z","publicationName":"your story","headlineEdited":"Robotics startup Perceptyne raises $3M in seed funding","isVideo":false},{"url":"https://startuprise.org/perceptyne-secures-3-mn-seed-funding/","date":"2024-10-14T00:00:00.000Z","publicationName":"Startup Rise","headlineEdited":"Perceptyne Secures $3 Mn Seed Funding From Endiya Partners, Yali Capital & Others","isVideo":false},{"url":"https://startupstorymedia.com/insights-healthtech-startup-4basecare-secures-6-mn-in-series-a-funding-eyes-global-expansion/","date":"2024-08-12T00:00:00.000Z","publicationName":"startup story","headlineEdited":"Healthtech Startup 4baseCare Secures $6 Mn in Series A Funding, Eyes Global Expansion","isVideo":false},{"url":"https://www.vccircle.com/truva4basecare-two-others-secure-early-stage-funds","date":"2024-08-12T00:00:00.000Z","publicationName":"vc circle","headlineEdited":"Truva, 4baseCare, 2 Others secure early stage funds","isVideo":false},{"url":"https://yourstory.com/2024/08/4basecare-raises-6m-seriesa-funding-plans-expansion","date":"2024-08-12T00:00:00.000Z","publicationName":"your story","headlineEdited":"4baseCare raises $6M in Series A funding led by Yali Capital","isVideo":false},{"url":"https://economictimes.indiatimes.com/tech/funding/yali-capital-launches-rs-810-crore-deep-tech-fund/articleshow/111760323.cms","date":"2024-08-12T00:00:00.000Z","publicationName":"economic times","headlineEdited":"Yali Capital launches ₹810 crore deep-tech fund","isVideo":false},{"url":"https://economictimes.indiatimes.com/prime/technology-and-startups/dont-just-look-overseas-indian-deep-tech-startups-have-huge-opportunities-in-the-domestic-market-lip-bu-tan/primearticleshow/111833512.cms?from=mdr","date":"2024-07-18T00:00:00.000Z","publicationName":"economic times","headlineEdited":"Don’t just look overseas; Indian deep-tech should mine the domestic market: Lip-Bu Tan","isVideo":false},{"url":"https://www.youtube.com/watch?v=5H2qRuEMbCM","date":"2024-07-16T00:00:00.000Z","publicationName":"CNBC TV18","headlineEdited":"Generative AI Will Be Bigger Than The Internet: Walden International | CNBC TV18","isVideo":true},{"url":"https://www.youtube.com/watch?v=83OBB_oOcrw","date":"2024-07-15T00:00:00.000Z","publicationName":"CNBC TV18","headlineEdited":"Yali Capital Rolls Out ₹810 Cr Fund To Back Deeptech Startups","isVideo":true},{"url":"https://www.moneycontrol.com/technology/vc-industry-veterans-launch-rs-810-cr-deeptech-focused-fund-yali-capital-article-12769665.html","date":"2024-07-15T00:00:00.000Z","publicationName":"moneycontrol","headlineEdited":"VC industry veterans launch Rs 810-cr deeptech-focused fund \'Yali Capital\'","isVideo":false},{"url":"https://www.linkedin.com/posts/yali-capital_deeptech-patents-startupinvestment-activity-7226481319805956096-Scvg/?utm_source=combined_share_message&utm_medium=member_desktop","date":"2024-05-12T00:00:00.000Z","publicationName":"LinkedIn","headlineEdited":"Gani: The patent portfolio measures the strength of a deep tech company","isVideo":true}]}}')},5290:function(e){"use strict";e.exports=JSON.parse('{"Team Members":[{"Order":1,"Name":"Ganapathy \'Gani\' Subramaniam","Designation":"Founding Managing Partner","One-Liner":"Over 30 years of industry knowledge, including a decade of entrepreneurial and investing experience.","Detailed":"Gani comes with over 30 years of industry knowledge of which nearly a decade consists of entrepreneurial and investing experience. Gani served as a Director at semiconductor giant Texas Instruments where he spent a total of 15 years. Leaning into his experience with Cosmic Circuits, a company he later founded, grew and sold, Gani has since been on the board of five other companies in the deep tech space. At Yali Capital, Gani serves as its Managing Partner.","linkedin":"https://www.linkedin.com/in/ganapathy-subramaniam-25859827/","email":"gani@yali.vc","image":"/images/gani.webp"},{"Order":3,"Name":"Mathew Cyriac","Designation":"Founding General Partner","One-Liner":"Chairman of Florintree Advisors with extensive private equity and corporate leadership experience.","Detailed":"Mathew Cyriac, Chairman of Florintree Advisors, brings a wealth of top-tier private equity and corporate leadership experience. As the former Co-head of Blackstone India PE, Mathew managed an impressive $3 billion in assets and more recently the success of IPOs of MTAR, Data Patterns, and ideaForge stand testimony to his incredibly rich and diverse leadership experience. Currently serving as the Chairman of Gokaldas Exports and holding board positions in several prominent companies, including Tata Capital and Tata Play, Mathew offers a unique blend of operational knowledge and strategic vision.","linkedin":"https://www.linkedin.com/in/mathew-cyriac-9663181b5/","email":"mathew@yali.vc","image":"/images/mathew-cyriac.webp"},{"Order":4,"Name":"Karthikeyan \'Karthik\' Madathil","Designation":"Partner","One-Liner":"30 years of deep tech experience with leadership roles in multinational corporations and startups.","Detailed":"Karthik brings 30 years of deep tech experience to the table, with eight years as VP of Engineering at a deep tech startup. His wealth of experience includes an ML-powered EdTech company that he founded and led for five years in addition to a 17-year tenure across various leadership roles, from Engineering Head to Business Head, in both multinational corporations and startups specialising in IC design.","linkedin":"https://www.linkedin.com/in/kmadathil/","email":"karthik@yali.vc","image":"/images/karthik.webp"},{"Order":2,"Name":"Lip-Bu Tan","Designation":"Advisor","One-Liner":"Over four decades of experience in semiconductor and deep tech industries with a proven track record in venture investing.","Detailed":"Lip-Bu Tan brings over four decades of unparalleled experience in the semiconductor and deep tech industries, combining executive leadership with a proven track record in venture investing. As the former CEO and Executive Chairman of Cadence Design Systems, a company with a market capitalization of approximately $60 billion, Lip-Bu led the organisation to become a global leader in electronic design automation. Over the course of his career, he has led the charge, taking over 130 companies to successful IPOs, and cementing his status as a visionary investor in the global tech landscape. His role on our Advisory Board provides invaluable insights, particularly in the semiconductor and deep tech sectors, guiding investment strategies with his wealth of knowledge and foresight.","linkedin":"https://www.linkedin.com/in/lip-bu-tan-284a7846/","email":"lip-bu@yali.vc","image":"/images/lip-bu_tan.webp"}]}')}},function(e){e.O(0,[768,701,784,648,971,23,744],function(){return e(e.s=3710)}),_N_E=e.O()}]);