// ===== CORE STORAGE + SUPABASE WRAPPER =====
const LS_SETTINGS = 'resto_settings_v3';
const LS_MENUS = 'resto_menus_v2';
const LS_ORDERS = 'resto_orders_v2';

const DEFAULT_SETTINGS = {
  nama: "Warung Sahabat",
  alamat: "Jl. Sahabat No. 12, Banjarmasin",
  pajak: 0,
  jumlahMeja: 12,
  pinKasir: "1234",
  pinAdmin: "9999"
};

const DEFAULT_MENUS = [
  {id:"m1", nama:"Ayam Bakar Galam", harga:28000, kategori:"Makanan", foto:"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400", stok:"tersedia"},
  {id:"m2", nama:"Nasi Goreng Kampung", harga:22000, kategori:"Makanan", foto:"https://images.unsplash.com/photo-1603133872875-ca2a98a0c45d?w=400", stok:"tersedia"},
  {id:"m3", nama:"Soto Banjar", harga:25000, kategori:"Makanan", foto:"https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400", stok:"tersedia"},
  {id:"m4", nama:"Es Teh Manis", harga:6000, kategori:"Minuman", foto:"https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400", stok:"tersedia"},
  {id:"m5", nama:"Es Jeruk Peras", harga:8000, kategori:"Minuman", foto:"https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400", stok:"tersedia"},
  {id:"m6", nama:"Pisang Goreng", harga:12000, kategori:"Snack", foto:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400", stok:"tersedia"},
];

function getSettings(){ try{return JSON.parse(localStorage.getItem(LS_SETTINGS))||{...DEFAULT_SETTINGS}}catch(e){return {...DEFAULT_SETTINGS}} }
function saveSettings(s){ localStorage.setItem(LS_SETTINGS, JSON.stringify(s)); bcPost('settings', s); pushSettingsToSupa(s); }
function getMenus(){ try{let m=JSON.parse(localStorage.getItem(LS_MENUS)); return m&&m.length?m:DEFAULT_MENUS}catch(e){return DEFAULT_MENUS} }
function saveMenus(m){ localStorage.setItem(LS_MENUS, JSON.stringify(m)); bcPost('menus',m); }
function getOrders(){ try{return JSON.parse(localStorage.getItem(LS_ORDERS))||[]}catch(e){return []} }
function saveOrders(o){ localStorage.setItem(LS_ORDERS, JSON.stringify(o)); bcPost('orders',o); }

// BroadcastChannel for realtime antar tab (tanpa Supabase)
let bc=null; try{ bc=new BroadcastChannel('resto_bc'); }catch(e){}
function bcPost(type,payload){ try{ bc&&bc.postMessage({type,payload}); }catch(e){} }
function onBC(cb){ if(bc) bc.onmessage=e=>cb(e.data); window.addEventListener('storage', (ev)=>{ if(ev.key===LS_ORDERS) cb({type:'orders',payload:getOrders()}); if(ev.key===LS_MENUS) cb({type:'menus',payload:getMenus()}); }); }

function genId(){ return 'ORD'+Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,4).toUpperCase(); }
function rupiah(n){ return 'Rp '+Number(n).toLocaleString('id-ID'); }
function fmtDate(d){ const x=new Date(d); return x.toLocaleDateString('id-ID')+' '+x.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}); }
function todayStr(){ return new Date().toISOString().slice(0,10); }

// Supabase optional
let supa=null;
function initSupa(){
  if(typeof SUPABASE_URL!=='undefined' && SUPABASE_URL && typeof supabase!=='undefined'){
    try{ supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); }catch(e){ supa=null; }
  }
}
function hasSupa(){ return !!supa; }

async function syncOrdersFromSupa(){
  if(!hasSupa()) return [];
  try{
    const {data,error} = await supa.from('orders').select('*').order('created_at',{ascending:false}).limit(200);
    if(error){ console.warn('syncOrders error',error.message); return getOrders(); }
    if(data){
      const mapped=data.map(o=>({
        id:o.id, tipe:o.tipe, meja:o.meja, nama:o.nama, wa:o.wa||null,
        jamAmbil:o.jam_ambil||o.jamAmbil||null, jam_ambil:o.jam_ambil||null,
        catatan:o.catatan, items: typeof o.items==='string'? JSON.parse(o.items): o.items,
        subtotal:o.subtotal, pajak:o.pajak, total:o.total, status:o.status, created_at:o.created_at
      }));
      // simpan tanpa trigger loop besar: langsung localStorage
      localStorage.setItem(LS_ORDERS, JSON.stringify(mapped));
      return mapped;
    }
  }catch(e){ console.warn(e); }
  return getOrders();
}

async function syncSettingsFromSupa(){
  if(!hasSupa()) return getSettings();
  try{
    const {data,error}=await supa.from('settings').select('*').eq('id','default').single();
    if(!error && data){
      const mapped={nama:data.nama, alamat:data.alamat, pajak:data.pajak, jumlahMeja:data.jumlah_meja, pinKasir:data.pin_kasir, pinAdmin:data.pin_admin};
      localStorage.setItem(LS_SETTINGS, JSON.stringify(mapped));
      return mapped;
    }
  }catch(e){ console.warn(e); }
  return getSettings();
}
async function pushSettingsToSupa(s){
  if(!hasSupa()) return;
  try{ await supa.from('settings').upsert({id:'default', nama:s.nama, alamat:s.alamat, pajak:s.pajak, jumlah_meja:s.jumlahMeja, pin_kasir:s.pinKasir, pin_admin:s.pinAdmin, updated_at:new Date().toISOString()}); }catch(e){}
}

async function syncMenusFromSupa(){
  if(!hasSupa()) return getMenus();
  try{
    const {data,error}=await supa.from('menus').select('*').order('nama');
    if(!error && data && data.length){
      const mapped=data.map(m=>({id:m.id,nama:m.nama,harga:m.harga,kategori:m.kategori,foto:m.foto,stok:m.stok}));
      localStorage.setItem(LS_MENUS, JSON.stringify(mapped));
      return mapped;
    }
  }catch(e){}
  return getMenus();
}


// Order helpers
function calcCart(cart, pajakPct){
  let sub=0; cart.forEach(c=> sub+= c.harga*c.qty);
  let pajak = Math.round(sub * pajakPct/100);
  return {subtotal:sub, pajak, total:sub+pajak};
}

// Nota PDF
function downloadNota(order, settings){
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF({unit:'mm', format:[80, 140 + order.items.length*8]});
  let y=8;
  doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.text(settings.nama, 40, y, {align:'center'}); y+=4;
  doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.text(settings.alamat, 40, y, {align:'center'}); y+=4;
  doc.setLineWidth(0.2); doc.line(4,y,76,y); y+=4;
  doc.setFontSize(7);
  doc.text('ID: '+order.id, 4, y); y+=3;
  doc.text('Tgl: '+fmtDate(order.created_at), 4, y); y+=3;
  if(order.tipe==='dinein') doc.text('Tipe: DINE IN  |  Meja: '+order.meja+(order.nama?'  |  '+order.nama:''), 4, y);
  else doc.text('Tipe: TAKEAWAY  |  '+order.nama, 4, y);
  y+=3;
  // jamAmbil tidak dipakai lagi
  if(order.catatan){ doc.text('Catatan: '+order.catatan, 4, y); y+=3; }
  y+=1; doc.line(4,y,76,y); y+=4;
  doc.setFont('helvetica','bold'); doc.text('Rincian Pesanan:',4,y); y+=3; doc.setFont('helvetica','normal');
  order.items.forEach(it=>{
    doc.text(it.nama+'  x'+it.qty, 4, y);
    doc.text(rupiah(it.harga*it.qty), 76, y, {align:'right'});
    y+=3;
  });
  y+=1; doc.line(4,y,76,y); y+=4;
  doc.text('Subtotal: '+rupiah(order.subtotal), 4, y); y+=3;
  if(settings.pajak>0){ doc.text('Pajak '+settings.pajak+'%: '+rupiah(order.pajak), 4, y); y+=3; }
  doc.setFont('helvetica','bold'); doc.text('TOTAL: '+rupiah(order.total), 4, y); y+=5;
  doc.setFont('helvetica','normal'); doc.setFontSize(7);
  doc.text('Terima kasih telah memesan di '+settings.nama+'!', 40, y, {align:'center'}); y+=3;
  doc.text('Pembayaran: Bayar di Kasir (Tunai/QRIS)', 40, y, {align:'center'});
  doc.save('Nota-'+order.id+'.pdf');
}

// Excel export helper (SheetJS)
function exportOrdersExcel(orders, settings, filename){
  const rows = orders.map(o=> ({
    ID:o.id, Tipe:o.tipe==='dinein'?'DINE IN':'TAKEAWAY',
    Meja:o.meja||'-', Nama:o.nama||'-', WA:o.wa||'-', 'Jam Ambil':o.jamAmbil||'-',
    Status:o.status, Tanggal:fmtDate(o.created_at),
    Items:o.items.map(i=> i.nama+' x'+i.qty).join(', '),
    Subtotal:o.subtotal, Pajak:o.pajak, Total:o.total, Catatan:o.catatan||'-'
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekap");
  XLSX.writeFile(wb, filename);
}
function exportOrdersPDF(orders, settings, title){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape'});
  doc.setFontSize(12); doc.text(settings.nama+' - '+title, 14, 12);
  doc.setFontSize(8); doc.text('Dicetak: '+fmtDate(new Date().toISOString()), 14, 17);
  const head=[['ID','Tipe','Meja/Nama','Status','Waktu','Items','Total']];
  const body=orders.map(o=>[o.id, o.tipe==='dinein'?'DINE IN':'TAKEAWAY', o.tipe==='dinein'?('Meja '+o.meja):o.nama, o.status, fmtDate(o.created_at), o.items.map(i=>i.nama+' x'+i.qty).join(', '), rupiah(o.total)]);
  doc.autoTable({head, body, startY:20, styles:{fontSize:7}, headStyles:{fillColor:[17,24,39]}});
  let y=doc.lastAutoTable.finalY+8;
  const omzet=orders.filter(o=>o.status==='lunas').reduce((a,b)=>a+b.total,0);
  doc.text('Total Omzet (Lunas): '+rupiah(omzet)+'  |  Jumlah Pesanan: '+orders.length, 14, y);
  doc.save(title.replace(/\s+/g,'_')+'.pdf');
}
