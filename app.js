/* KAMERAD basecamp edition - Application Logic, Auth, i18n & 3D Coverflow Carousel */

// ============================================================
// SUPABASE CONFIGURATION
// Automatic silent connection
// ============================================================
const SUPABASE_URL = 'https://pykyaapmagmgoihfzyfr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ykw4aeWnJZ-SWw8ysAY2ng_AOwAuNW3';

// Basecamp WhatsApp Contact Config
const BASECAMP_WHATSAPP_NUMBER = '6281803590667';

// Admin Credentials
const ADMIN_USERNAME_CRED = 'Kamerad';
const ADMIN_PASSWORD_CRED = 'KameradAdmin123';

// Database-Aware Real-Time Order ID Generator: #PRE-(YYMMDD)-(001, 002...)-7
async function fetchNextDailyOrderCode(prefix = 'CD') {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;

  let maxCount = 0;

  // 1. Query Supabase rentals table for ALL order attempts today (unconditional increment)
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('rentals')
        .select('order_code');

      if (!error && data && data.length > 0) {
        data.forEach(row => {
          if (row.order_code) {
            const match = row.order_code.match(/(\d{6})(\d{3})7$/);
            if (match && match[1] === dateStr) {
              const num = parseInt(match[2], 10);
              if (num > maxCount) maxCount = num;
            }
          }
        });
      }
    } catch (err) {
      console.error('Supabase daily order query error:', err);
    }
  }

  // 2. Also check localBookings backup for today's count
  const localList = JSON.parse(localStorage.getItem('kmrd_local_bookings') || '[]');
  localList.forEach(b => {
    const code = b.orderId || b.order_code || '';
    const match = code.match(/(\d{6})(\d{3})7$/);
    if (match && match[1] === dateStr) {
      const num = parseInt(match[2], 10);
      if (num > maxCount) maxCount = num;
    }
  });

  // 3. Increment counter sequentially
  const nextCount = maxCount + 1;
  const countStr = String(nextCount).padStart(3, '0');

  // Save to local counter state
  localStorage.setItem('kmrd_daily_counter', JSON.stringify({ date: dateStr, count: nextCount }));

  return `${prefix}-${dateStr}${countStr}7`;
}

// Receipt Date Formatter: DD Mon YYYY (e.g. 13 Aug 2026)
function formatReceiptDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

// i18n Translation Dictionary (ID is Default)
const TRANSLATIONS = {
  id: {
    nav_cart: 'Keranjang',
    nav_home: 'Home',
    nav_rental_equipment: 'Rental Equipment',
    nav_open_trip: 'Open Trip',
    nav_for_sale: 'K-Shop',
    nav_laundry_service: 'Laundry Service',
    nav_account: 'Akun Saya / Login',
    home_title: 'KAMERAD basecamp edition',
    card_1_desc: 'Temukan dan sewa semua kebutuhan peralatan & perlengkapan pendakian Anda.',
    card_2_desc: 'Bergabung dalam trip alam seru bersama tim pendaki berpengalaman kami.',
    card_3_desc: 'Layanan cuci profesional, perawatan bulu angsa, waterproofing, dan perbaikan alat.',
    for_sale_subtitle: 'Beli peralatan pendakian original baru dan aksesoris siap pakai untuk kebutuhan ekspedisi Anda.',
    laundry_subtitle: 'Layanan cuci profesional, perawatan bulu angsa, waterproofing, dan sterilisasi alat gunung.',
    promo_tag: 'PROMO SPESIAL',
    promo_text: '🔥 Diskon s/d 30% Paket Outdoor & Alat Gunung!',
    promo_sub: '• Reservasi Online • DP atau COD di Basecamp',
    hero_tag: 'OFFICIAL BASECAMP EQUIPMENT RENTAL',
    hero_title_1: 'GEAR UP FOR THE',
    hero_title_accent: 'SUMMIT',
    hero_desc: 'High-performance mountaineering gear, 4-season geodesic tents, down bags, and technical packs. Reserve online with Down Payment or COD at Basecamp Pickup.',
    hero_chip_1: 'Verified Gear Quality',
    hero_chip_2: 'Next-Day BC Pickup for COD',
    hero_chip_3: 'Direct WhatsApp Confirmation',
    search_dates_title: '🗓️ Pilih Tanggal Sewa',
    pickup_date_label: 'Tanggal Ambil',
    return_date_label: 'Tanggal Kembali',
    search_placeholder: 'Cari alat (contoh: tenda 4 orang, kerir, kompor...)',
    catalog_title: 'Peralatan & Promo Tersedia',
    catalog_badge: '🟢 Stok Tersedia',
    catalog_subtitle: 'Harga sewa tertera untuk durasi paket 2 Hari (Base Rate) + biaya perpanjangan per 1 Hari berikutnya.',
    filter_all: 'Semua Alat',
    filter_promo: '🔥 Promo Spesial',
    filter_tents: '⛺ Tenda & Selter',
    filter_backpacks: '🎒 Kerir & Ransel',
    filter_sleeping: '🌙 Sleeping Bag & Matras',
    filter_stoves: '🔥 Kompor & Alat Masak',
    filter_lighting: '💡 Senter & Elektronik',
    btn_specs: 'Spesifikasi',
    btn_add_rental: 'Tambah Sewa',
    btn_out_of_stock: 'Stok Habis',
    stock_in_stock: 'Stok Tersedia',
    stock_low_stock: 'Sisa',
    stock_no_stock: 'STOK HABIS',
    rate_unit_base: '/ 2 Hari',
    rate_unit_extra: '/ hari tambahan',
    cart_title: 'Keranjang Sewa Anda',
    cart_duration_header: '📅 DURASI SEWA',
    payment_method_title: '💳 Pilih Metode Pembayaran',
    pay_dp_title: 'Down Payment',
    pay_dp_sub: 'Kunci booking dengan DP',
    pay_cod_title: 'Full COD',
    pay_cod_sub: 'Bayar di Basecamp',
    select_dp_label: 'Pilih Persentase DP:',
    cod_warning_title: 'Kebijakan COD:',
    cod_warning_text: 'Pengambilan COD di Basecamp wajib dipesan minimal H+1 (esok hari).',
    summary_subtotal_label: 'Biaya Paket:',
    summary_grand_total_label: 'Total Biaya Sewa:',
    summary_dp_required_label: 'Down Payment (DP) Wajib:',
    summary_balance_label: 'Sisa Bayar saat Pengambilan:',
    btn_proceed_checkout: 'Lanjut ke Checkout',
    checkout_title: 'Lengkapi Pesanan Basecamp',
    label_fullname: 'Nama Lengkap Penyewa *',
    label_phone: 'Nomor WhatsApp *',
    label_notes: 'Catatan Tambahan (Opsional)',
    btn_back_to_cart: 'Kembali ke Keranjang',
    btn_submit_wa: 'Kirim & Pesan via WhatsApp',
    base_rate_text: 'Paket Minimal (2 Hari)',
    extra_days_text: 'Hari Tambahan'
  },
  en: {
    nav_cart: 'Cart',
    nav_home: 'Home',
    nav_rental_equipment: 'Rental Equipment',
    nav_open_trip: 'Open Trip',
    nav_for_sale: 'K-Shop',
    nav_laundry_service: 'Laundry Service',
    nav_account: 'My Account / Login',
    home_title: 'KAMERAD basecamp edition',
    card_1_desc: 'Find and rent out your need of equipment and supplies for adventures',
    card_2_desc: 'Join adventurous nature trip together with our experienced teams',
    card_3_desc: 'Professional gear washing, down care, waterproofing, and repair',
    for_sale_subtitle: 'Buy brand new original trekking gear and ready-to-use accessories for your expedition.',
    laundry_subtitle: 'Professional gear wash, down care, waterproofing, and sterilization for post-trek outdoor gear.',
    promo_tag: 'SPECIAL PROMO',
    promo_text: '🔥 Up to 30% OFF Expedition Bundles & Solo Trekker Kits!',
    promo_sub: '• Reserve Online • Down Payment or Basecamp Pickup',
    hero_tag: 'OFFICIAL BASECAMP EQUIPMENT RENTAL',
    hero_title_1: 'GEAR UP FOR THE',
    hero_title_accent: 'SUMMIT',
    hero_desc: 'High-performance mountaineering gear, 4-season geodesic tents, down bags, and technical packs. Reserve online with Down Payment or COD at Basecamp Pickup.',
    hero_chip_1: 'Verified Gear Quality',
    hero_chip_2: 'Next-Day BC Pickup for COD',
    hero_chip_3: 'Direct WhatsApp Confirmation',
    search_dates_title: '🗓️ Select Rental Dates',
    pickup_date_label: 'Pickup Date',
    return_date_label: 'Return Date',
    search_placeholder: 'Search gear (e.g. 4-season tent, backpack, stove...)',
    catalog_title: 'Available Equipment & Promos',
    catalog_badge: '🟢 Stock Available',
    catalog_subtitle: 'Rental prices shown for a minimum 2-Day Base Rate + extension fee per additional day.',
    filter_all: 'All Gear',
    filter_promo: '🔥 Special Promos',
    filter_tents: '⛺ Tents & Shelters',
    filter_backpacks: '🎒 Technical Packs',
    filter_sleeping: '🌙 Sleeping Systems',
    filter_stoves: '🔥 Stoves & Cooking',
    filter_lighting: '💡 Lighting & Tech',
    btn_specs: 'Specs',
    btn_add_rental: 'Add to Rental',
    btn_out_of_stock: 'Out of Stock',
    stock_in_stock: 'In Stock',
    stock_low_stock: 'Only',
    stock_no_stock: 'OUT OF STOCK',
    rate_unit_base: '/ 2 Days',
    rate_unit_extra: '/ extra day',
    cart_title: 'Your Rental Cart',
    cart_duration_header: '📅 RENTAL DURATION',
    payment_method_title: '💳 Choose Payment Method',
    pay_dp_title: 'Down Payment',
    pay_dp_sub: 'Lock booking with DP',
    pay_cod_title: 'Full COD',
    pay_cod_sub: 'Pay at Basecamp',
    select_dp_label: 'Select DP Percentage:',
    cod_warning_title: 'COD Policy:',
    cod_warning_text: 'Basecamp COD pickups require booking at least 1 day in advance (next-day pickup).',
    summary_subtotal_label: 'Package Rate:',
    summary_grand_total_label: 'Grand Total:',
    summary_dp_required_label: 'Down Payment Required:',
    summary_balance_label: 'Remaining Balance at Pickup:',
    btn_proceed_checkout: 'Proceed to Checkout',
    checkout_title: 'Complete Your Basecamp Order',
    label_fullname: 'Your Full Name *',
    label_phone: 'WhatsApp Phone Number *',
    label_notes: 'Special Notes (Optional)',
    btn_back_to_cart: 'Back to Cart',
    btn_submit_wa: 'Submit & Order via WhatsApp',
    base_rate_text: 'Base Rate (2 Days)',
    extra_days_text: 'Extra Days'
  }
};

// Language State (Indonesian 'id' by default)
let currentLang = localStorage.getItem('kmrd_lang') || 'id';

// Customer & Admin Auth State
let currentCustomer = JSON.parse(localStorage.getItem('kmrd_customer_session') || 'null');
let isAdminLoggedIn = sessionStorage.getItem('kmrd_admin_session') === 'true';

// Local Bookings Storage
let localBookings = JSON.parse(localStorage.getItem('kmrd_local_bookings') || '[]');

// Carousel Active Card Index (1 = Walk With Kamerad is center)
let activeCarouselIndex = 1;

// Selected Trip for Modal Confirmation
let selectedTripForRegistration = null;

// Selected Laundry Service & Timing Option State
let selectedLaundryService = null;
let selectedLaundryDropOffDate = formatDateInput(new Date());

// Multi-Category Active Cart Tab ('rental', 'laundry', 'sale')
let activeCartTab = 'rental';

// Category-Specific Payment & Delivery Selection State
let paymentSelection = {
  method: 'dp',                // 'dp' or 'cod' for rental
  rentalDpMethod: 'Transfer BCA', // 'Transfer BCA' or 'QRIS'
  dpPercent: 50,
  laundryMethod: 'dropoff_cash', // 'dropoff_cash' (Cash On Drop-off), 'transfer', 'qris'
  kshopMethod: 'transfer',       // 'transfer' (Transfer / QRIS), 'cod' (Tunai di Basecamp)
  kshopDelivery: 'pickup'        // 'pickup' (Self Pickup), 'courier' (Via Kurir)
};

// Gear Database
let GEAR_CATALOG = [
  {
    id: 'kmrd-t1',
    name: 'KAMERAD Arcus-XT 4-Person Expedition Tent',
    name_id: 'Tenda KAMERAD Arcus-XT 4-Person Expedition',
    category: 'tents',
    priceBase2Days: 50000,
    priceExtraDay: 20000,
    originalPrice: null,
    isPromo: false,
    promoTag: null,
    specs: ['4 Person', 'Geodesic Alloy Frame', '10,000mm Waterproof', 'Snow Skirt'],
    specs_id: ['4 Kapasitas', 'Frame Alloy Geodesic', '10.000mm Waterproof', 'Snow Skirt'],
    image: 'assets/tent_4season.jpg',
    description: 'Stormproof 4-person geodesic tent built to withstand extreme mountain ridge winds.',
    description_id: 'Tenda geodesic 4-person tahan badai yang dirancang khusus menerjang angin kencang.',
    stock: 12,
    weight: '3.4 kg'
  },
  {
    id: 'kmrd-p1',
    name: 'KAMERAD Summit Alpine Bundle (Tent + Pack + Bag)',
    name_id: 'Paket Promo KAMERAD Summit Alpine (Tenda + Kerir + Sleeping Bag)',
    category: 'promo',
    priceBase2Days: 100000,
    priceExtraDay: 40000,
    originalPrice: 140000,
    isPromo: true,
    promoTag: 'SPECIAL BUNDLE - 30% OFF',
    promoTag_id: 'PAKET PROMO - DISKON 30%',
    specs: ['Complete 2-Person Kit', '4-Season Geodesic Tent', '65L Technical Pack', '0°C Down Bags x2'],
    specs_id: ['Paket Lengkap 2 Orang', 'Tenda 4-Season Geodesic', 'Kerir 65L Teknikal', 'Sleeping Bag Bulu Angsa x2'],
    image: 'assets/hero_banner.jpg',
    description: 'The ultimate basecamp combo for 2 adventurers.',
    description_id: 'Paket sewa lengkap hemat untuk 2 pendaki.',
    stock: 5,
    weight: '7.2 kg total'
  },
  {
    id: 'kmrd-p2',
    name: 'Weekend Fastpack Promo Kit (Tent + Stove)',
    name_id: 'Paket Promo Solo Fastpack (Tenda + Kompor)',
    category: 'promo',
    priceBase2Days: 65000,
    priceExtraDay: 25000,
    originalPrice: 90000,
    isPromo: true,
    promoTag: 'HOT DEAL - 25% OFF',
    promoTag_id: 'PROMO HEMAT - DISKON 25%',
    specs: ['Solo Trekker Pack', 'Ultralight 1P Tent', 'Windproof Jet Stove'],
    specs_id: ['Paket Solo Trekker', 'Tenda Ringan 1P', 'Kompor Lapangan Windproof'],
    image: 'assets/tent_4season.jpg',
    description: 'Lightweight solo setup designed for fast weekend summit pushes.',
    description_id: 'Set sewa ringkas ultra-light untuk pendakian solo akhir pekan.',
    stock: 8,
    weight: '3.1 kg total'
  },
  {
    id: 'kmrd-t2',
    name: 'KAMERAD MicroLite 2P Trekking Tent',
    name_id: 'Tenda KAMERAD MicroLite 2P Trekking',
    category: 'tents',
    priceBase2Days: 35000,
    priceExtraDay: 15000,
    originalPrice: null,
    isPromo: false,
    promoTag: null,
    specs: ['2 Person', 'Freestanding', '3-Season', 'Double Vestibule'],
    specs_id: ['2 Kapasitas', 'Freestanding', '3-Season', 'Teras Ganda'],
    image: 'assets/tent_4season.jpg',
    description: 'Quick pitch 3-season tent with dual entry vestibules.',
    description_id: 'Tenda 3-season cepat pasang dengan teras ganda.',
    stock: 15,
    weight: '1.9 kg'
  },
  {
    id: 'kmrd-b1',
    name: 'KAMERAD Vanguard 65L Expedition Pack',
    name_id: 'Kerir KAMERAD Vanguard 65L Expedition',
    category: 'backpacks',
    priceBase2Days: 30000,
    priceExtraDay: 10000,
    originalPrice: null,
    isPromo: false,
    promoTag: null,
    specs: ['65L Capacity', 'Adjustable Spine Harness', 'Integrated Rain Cover'],
    specs_id: ['Kapasitas 65 Liter', 'Busa Punggung Ergo', 'Jas Hujan Kerir'],
    image: 'assets/hero_banner.jpg',
    description: 'Heavy load carrier with ergo-fit hipbelt.',
    description_id: 'Kerir beban berat dengan hipbelt ergonomis.',
    stock: 10,
    weight: '2.1 kg'
  },
  {
    id: 'kmrd-s1',
    name: 'KAMERAD Inferno 800 Down Sleeping Bag (-5°C)',
    name_id: 'Sleeping Bag KAMERAD Inferno 800 Down (-5°C)',
    category: 'sleeping',
    priceBase2Days: 25000,
    priceExtraDay: 10000,
    originalPrice: null,
    isPromo: false,
    promoTag: null,
    specs: ['800 Fill Goose Down', '-5°C Comfort Rating', 'Compression Sack'],
    specs_id: ['Bulu Angsa 800 Fill', 'Suhu Nyaman -5°C', 'Kantong Kompresi'],
    image: 'assets/hero_banner.jpg',
    description: 'Plush sub-zero down mummy sleeping bag.',
    description_id: 'Sleeping bag hangat tipe mummy berbahan bulu angsa.',
    stock: 20,
    weight: '980 g'
  }
];

// Open Trips Database (Walk With Kamerad Expeditions)
const OPEN_TRIPS = [
  {
    id: 'trip-1',
    title: 'Open Trip Mt. Rinjani 3726 MDPL (Lombok)',
    price: 2450000,
    dateRange: '25 – 28 Agustus 2026',
    duration: '4D3N',
    difficulty: 'Moderate – Hard',
    image: 'assets/nature_trip_banner.jpg',
    specs: ['Guide & Porter Team', 'Full Camping Gear', 'Logistik Pendakian', 'Simaksi Resmi'],
    desc: 'Ekspedisi puncakan Gunung Rinjani & Danau Segara Anak. Fasilitas tenda 4-season & makanan bergizi.'
  },
  {
    id: 'trip-2',
    title: 'Open Trip Mt. Gede via Cibodas',
    price: 650000,
    dateRange: '5 – 6 September 2026',
    duration: '2D1N',
    difficulty: 'Beginner – Moderate',
    image: 'assets/hero_banner.jpg',
    specs: ['Guide Kamerad', 'Tenda & Alat Masak', 'Simaksi Online', 'P3K & Radio HT'],
    desc: 'Pendakian santai Kawah Ratu & Alun-Alun Surya Kencana. Cocok untuk pendaki baru & pemula.'
  },
  {
    id: 'trip-3',
    title: 'Open Trip Sunrise Camp Mt. Prau Dieng',
    price: 480000,
    dateRange: '19 – 20 September 2026',
    duration: '2D1N',
    difficulty: 'Easy – Beginner',
    image: 'assets/tent_4season.jpg',
    specs: ['Golden Sunrise View', 'Tenda & Matras', 'Makan 3x', 'Dokumentasi Foto'],
    desc: 'Nikmati pemandangan Golden Sunrise Prau 2565 MDPL dengan tenda hangat dan fasilitas komplit.'
  }
];

// K-Shop Items (Peralatan K-Shop Dijual)
const FOR_SALE_ITEMS = [
  {
    id: 'sale-1',
    name: 'KAMERAD Carbon Trekking Pole (Pair)',
    name_id: 'Trekking Pole Karbon KAMERAD (Sepasang)',
    price: 185000,
    image: 'assets/hero_banner.jpg',
    specs: ['100% 3K Carbon Fiber', 'Quick Flip Lock', 'EVA Foam Grip'],
    specs_id: ['100% Karbon 3K', 'Kunci Flip Cepat', 'Grip Busa EVA']
  },
  {
    id: 'sale-2',
    name: 'Canister Gas Fuel 230g (Canister Supa-Burn)',
    name_id: 'Gas Canister 230g Ultra-Burn',
    price: 35000,
    image: 'assets/tent_4season.jpg',
    specs: ['Isobutane-Propane Mix', 'Sub-Zero Cold Weather Formula'],
    specs_id: ['Campuran Isobutana-Propana', 'Formula Suhu Dingin']
  },
  {
    id: 'sale-3',
    name: 'Nikwax Waterproofing Fabric Spray 300ml',
    name_id: 'Spray Waterproof Nikwax Fabric 300ml',
    price: 95000,
    image: 'assets/hero_banner.jpg',
    specs: ['Restores DWR Layer', 'Water Repellent Spray'],
    specs_id: ['Mengembalikan Lapisan DWR', 'Cairan Anti Air Tenda']
  }
];

// Laundry & Gear Care Services (Layanan Cuci Alat)
const LAUNDRY_SERVICES = [
  {
    id: 'laundry-1',
    name: 'Tent Wash & Waterproofing Treatment',
    name_id: 'Cuci Tenda & Treatment Anti-Air (Waterproofing)',
    price: 65000,
    image: 'assets/tent_4season.jpg',
    desc: 'Deep clean wash, seam sealing inspection, UV protection spray, and complete drying.',
    desc_id: 'Pembersihan mendalam, inspeksi seam tape, pelapisan ulang anti-air UV, dan pengeringan higienis.'
  },
  {
    id: 'laundry-2',
    name: 'Sleeping Bag Down Special Cleanse',
    name_id: 'Cuci Khusus Sleeping Bag Bulu Angsa (Down Wash)',
    price: 45000,
    image: 'assets/hero_banner.jpg',
    desc: 'Gentle down wash cleaner, loft restoration fluffing, and odor removal treatment.',
    desc_id: 'Pencucian lembut formula khusus bulu angsa, restorasi kehangatan loft, dan penghilang bau.'
  },
  {
    id: 'laundry-3',
    name: 'Technical Backpack Deep Wash & Sanitization',
    name_id: 'Cuci Kerir & Ransel Gunung Deep Clean',
    price: 50000,
    image: 'assets/hero_banner.jpg',
    desc: 'Backpack foam padding wash, strap degreasing, zipper lubrication, and anti-bacterial spray.',
    desc_id: 'Pembersihan busa punggung kerir, pencucian webbing strap, pelumasan resleting, dan anti-bakteri.'
  }
];

// App State
let cart = [];
let activeCategory = 'all';
let searchKeyword = '';
let supabaseClient = null;
let adminFilterStatus = 'ALL';

// Default Dates
const todayDate = new Date();
const endDateDefault = new Date();
endDateDefault.setDate(todayDate.getDate() + 2);

let rentalDates = {
  startDate: formatDateInput(todayDate),
  endDate: formatDateInput(endDateDefault)
};

// Select Payment Method for any category
function selectPaymentMethod(category, method) {
  if (category === 'rental') {
    paymentSelection.method = method;
    validateCODDateRule();
  } else if (category === 'laundry') {
    paymentSelection.laundryMethod = method;
  } else if (category === 'kshop') {
    paymentSelection.kshopMethod = method;
  }
  updateCartUI();
}

function selectKShopDelivery(deliveryMethod) {
  paymentSelection.kshopDelivery = deliveryMethod;
  updateCartUI();
}

function selectDPPercent(val) {
  paymentSelection.dpPercent = parseInt(val);
  updateCartUI();
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  setLanguage(currentLang);
  initSupabaseClient();
  setupDatePickers();
  renderNavAuthButtons();
  renderCarousel();
  renderCatalog();
  renderOpenTripsCatalog();
  renderForSaleCatalog();
  renderLaundryServices();
  updateCartUI();
  setupEventListeners();
  checkSecretAdminURL();
  checkEmailVerificationURL();
});

// ON-DEMAND SECTION SWITCHER
function showSection(sectionId) {
  document.querySelectorAll('.content-section').forEach(sec => {
    sec.classList.remove('active-section');
  });

  const targetEl = document.getElementById(sectionId);
  if (targetEl) {
    targetEl.classList.add('active-section');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Multi-Category Cart Tab Switcher ('rental', 'laundry', 'sale')
function switchCartTab(tabCat) {
  activeCartTab = tabCat;
  updateCartUI();
}

// 3D Coverflow Carousel Handlers
function renderCarousel() {
  const card0 = document.getElementById('carouselCard0');
  const card1 = document.getElementById('carouselCard1');
  const card2 = document.getElementById('carouselCard2');

  if (!card0 || !card1 || !card2) return;

  card0.className = 'carousel-card';
  card1.className = 'carousel-card';
  card2.className = 'carousel-card';

  if (activeCarouselIndex === 0) {
    card0.classList.add('card-center');
    card1.classList.add('card-right');
    card2.classList.add('card-left');
  } else if (activeCarouselIndex === 1) {
    card0.classList.add('card-left');
    card1.classList.add('card-center');
    card2.classList.add('card-right');
  } else {
    card0.classList.add('card-right');
    card1.classList.add('card-left');
    card2.classList.add('card-center');
  }
}

function prevCarouselCard() {
  activeCarouselIndex = (activeCarouselIndex - 1 + 3) % 3;
  renderCarousel();
}

function nextCarouselCard() {
  activeCarouselIndex = (activeCarouselIndex + 1) % 3;
  renderCarousel();
}

function handleCardClick(cardIndex, actionTarget) {
  activeCarouselIndex = cardIndex;
  renderCarousel();

  if (actionTarget) {
    showSection(actionTarget);
  }
}

// Secret Admin URL Trigger Detector (/kameradcrewonly/)
function checkSecretAdminURL() {
  const currentPath = window.location.pathname.toLowerCase();
  const currentHash = window.location.hash.toLowerCase();
  const currentSearch = window.location.search.toLowerCase();

  if (currentPath.includes('kameradcrewonly') || 
      currentHash.includes('kameradcrewonly') || 
      currentSearch.includes('kameradcrewonly')) {
    openAdminDashboardModal();
  }
}

window.addEventListener('hashchange', checkSecretAdminURL);
window.addEventListener('popstate', checkSecretAdminURL);

// Mobile Hamburger Drawer Handlers
function openMobileNav() {
  const drawerBackdrop = document.getElementById('navDrawerBackdrop');
  if (drawerBackdrop) drawerBackdrop.classList.add('active');
}

function closeMobileNav() {
  const drawerBackdrop = document.getElementById('navDrawerBackdrop');
  if (drawerBackdrop) drawerBackdrop.classList.remove('active');
}

// Globe Language Dropdown Handlers
function toggleLangDropdown() {
  const menu = document.getElementById('langDropdownMenu');
  if (menu) menu.classList.toggle('active');
}

function selectLanguage(lang) {
  setLanguage(lang);
  const menu = document.getElementById('langDropdownMenu');
  if (menu) menu.classList.remove('active');
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  const wrapper = document.querySelector('.lang-dropdown-wrapper');
  const menu = document.getElementById('langDropdownMenu');
  if (wrapper && menu && !wrapper.contains(e.target)) {
    menu.classList.remove('active');
  }
});

// Helper: Format Currency to Indonesian Rupiah (Rp)
function formatRupiah(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

// Helper: Format Date
function formatDateInput(dateObj) {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Calculate Rental Duration
function getRentalDurationDays() {
  const start = new Date(rentalDates.startDate);
  const end = new Date(rentalDates.endDate);
  const diffTime = end - start;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 2;
}

// Calculate Item Cost (Rental vs Fixed Price items like K-Shop, Laundry)
function getItemTotalCost(item, durationDays) {
  if (item.itemType === 'sale' || item.itemType === 'laundry' || item.price !== undefined) {
    return (item.price || item.priceBase2Days || 0) * item.qty;
  }
  const base2 = item.priceBase2Days || 50000;
  const extraPerDay = item.priceExtraDay || 20000;

  if (durationDays <= 2) {
    return base2 * item.qty;
  }
  const extraDays = durationDays - 2;
  return (base2 + (extraDays * extraPerDay)) * item.qty;
}

// Automatic & Silent Supabase Connection Setup
function initSupabaseClient() {
  const sbUrl = SUPABASE_URL || localStorage.getItem('kmrd_sb_url');
  const sbKey = SUPABASE_ANON_KEY || localStorage.getItem('kmrd_sb_key');

  if (sbUrl && sbKey && window.supabase) {
    try {
      supabaseClient = window.supabase.createClient(sbUrl, sbKey);
      fetchItemsFromSupabase();
    } catch (err) {
      console.error('Supabase connection error:', err);
    }
  }
}

// Fetch Real-Time Stock silently from Supabase `items` table
async function fetchItemsFromSupabase() {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient.from('items').select('*');
    if (error) throw error;

    if (data && data.length > 0) {
      data.forEach(dbItem => {
        const localItem = GEAR_CATALOG.find(i => i.id === dbItem.id);
        if (localItem) {
          localItem.stock = dbItem.stock;
          localItem.priceBase2Days = dbItem.price_base_2days || localItem.priceBase2Days;
          localItem.priceExtraDay = dbItem.price_extra_day || localItem.priceExtraDay;
        }
      });

      renderCatalog();
    }
  } catch (err) {
    console.error('Error fetching stock from Supabase:', err);
  }
}

// Render Nav Bar Auth Buttons (Person Icon)
function renderNavAuthButtons() {
  const container = document.getElementById('navAuthContainer');
  if (!container) return;

  const personIconSVG = `<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>`;

  if (isAdminLoggedIn) {
    container.innerHTML = `
      <button class="btn-icon" style="background: rgba(239, 68, 68, 0.15); border-color: var(--red-primary); color: #fca5a5;" onclick="openAdminDashboardModal()" aria-label="Staff Portal">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
        <span class="btn-label">Staff</span>
      </button>
      <button class="btn-icon" onclick="handleAdminLogout()" style="padding: 0.5rem 0.6rem;" aria-label="Logout">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
      </button>
    `;
  } else if (currentCustomer) {
    container.innerHTML = `
      <button class="btn-icon" onclick="openCustomerBookingsModal()" aria-label="My Account">
        ${personIconSVG}
        <span class="btn-label">${currentCustomer.name.split(' ')[0]}</span>
      </button>
      <button class="btn-icon" onclick="handleCustomerLogout()" style="padding: 0.5rem 0.6rem;" aria-label="Logout">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
      </button>
    `;
  } else {
    container.innerHTML = `
      <button class="btn-icon" onclick="openAuthModal('login')" aria-label="Login">
        ${personIconSVG}
        <span class="btn-label">${currentLang === 'id' ? 'Masuk' : 'Login'}</span>
      </button>
    `;
  }
}

// Render Open Trips Grid (Walk With Kamerad)
function renderOpenTripsCatalog() {
  const grid = document.getElementById('openTripGrid');
  if (!grid) return;

  grid.innerHTML = OPEN_TRIPS.map(trip => {
    return `
      <div class="service-card">
        <div class="card-img-container">
          <div class="promo-card-badge" style="background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%);">${trip.duration}</div>
          <img src="${trip.image}" alt="${trip.title}" class="card-img" loading="lazy">
        </div>
        <div class="card-body">
          <h3 class="card-title">${trip.title}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">${trip.desc}</p>
          <div style="font-size: 0.8rem; color: #a855f7; font-weight: 700;">🗓️ ${trip.dateRange} | 🏔️ Level: ${trip.difficulty}</div>
          <div class="card-specs-row">
            ${trip.specs.map(s => `<span class="spec-chip">${s}</span>`).join('')}
          </div>
          <div class="card-pricing-row">
            <div class="price-box">
              <span class="rental-rate">${formatRupiah(trip.price)}</span>
              <span class="rental-unit">/ pax (peserta)</span>
            </div>
          </div>
          <div class="card-actions" style="margin-top: 0.5rem;">
            <button class="btn-primary" onclick="openTripRegistrationModal('${trip.id}')" style="background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%); width: 100%;">
              ⛰️ ${currentLang === 'id' ? 'Daftar Trip via WhatsApp' : 'Register Trip via WA'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Open Trip Registration Confirmation Modal (Walk With Kamerad)
function openTripRegistrationModal(tripId) {
  const trip = OPEN_TRIPS.find(t => t.id === tripId);
  if (!trip) return;

  selectedTripForRegistration = trip;
  const modalBackdrop = document.getElementById('openTripConfirmModal');
  const modalBody = document.getElementById('openTripConfirmModalBody');

  const defaultName = currentCustomer ? currentCustomer.name : '';
  const defaultPhone = currentCustomer ? currentCustomer.phone : '';

  modalBody.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="display: flex; gap: 0.85rem; background: var(--bg-card); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); align-items: center;">
        <img src="${trip.image}" alt="${trip.title}" style="width: 76px; height: 76px; object-fit: cover; border-radius: var(--radius-sm);">
        <div>
          <span style="font-size: 0.72rem; color: #a855f7; font-weight: 800;">⛰️ WALK WITH KAMERAD</span>
          <h4 style="font-size: 1rem; color: #fff; margin: 2px 0;">${trip.title}</h4>
          <div style="font-size: 0.8rem; color: var(--text-muted);">🗓️ ${trip.dateRange} (${trip.duration})</div>
          <div style="font-size: 0.9rem; font-weight: 800; color: var(--green-success); margin-top: 2px;">${formatRupiah(trip.price)} / pax</div>
        </div>
      </div>

      <form onsubmit="submitTripRegistrationWA(event)">
        <div class="input-field-wrapper" style="margin-bottom: 0.75rem;">
          <label for="tripPaxCount">👤 Jumlah Peserta *</label>
          <input type="number" id="tripPaxCount" class="search-input" style="padding-left: 1rem;" value="1" min="1" max="30" required>
        </div>

        <div class="input-field-wrapper" style="margin-bottom: 0.75rem;">
          <label for="tripParticipantName">👤 Nama Ketua / Peserta *</label>
          <input type="text" id="tripParticipantName" class="search-input" style="padding-left: 1rem;" placeholder="e.g. Alex Harrison" value="${defaultName}" required>
        </div>

        <div class="input-field-wrapper" style="margin-bottom: 0.75rem;">
          <label for="tripParticipantPhone">📱 Nomor WhatsApp *</label>
          <input type="tel" id="tripParticipantPhone" class="search-input" style="padding-left: 1rem;" placeholder="e.g. 081803590667" value="${defaultPhone}" required>
        </div>

        <div class="input-field-wrapper" style="margin-bottom: 1rem;">
          <label for="tripNotes">📌 Catatan Tambahan (Opsional)</label>
          <input type="text" id="tripNotes" class="search-input" style="padding-left: 1rem;" placeholder="e.g. Request tenda khusus jika ada">
        </div>

        <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
          <button type="button" class="btn-secondary" onclick="closeOpenTripConfirmModal()">Batal</button>
          <button type="submit" class="btn-primary" style="background: linear-gradient(135deg, #a855f7 0%, #7e22ce 100%); border: none;">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.154 4.22 4.22-1.107z"/></svg>
            <span>Lanjut ke WhatsApp</span>
          </button>
        </div>
      </form>
    </div>
  `;

  modalBackdrop.classList.add('active');
}

function closeOpenTripConfirmModal() {
  const modalBackdrop = document.getElementById('openTripConfirmModal');
  if (modalBackdrop) modalBackdrop.classList.remove('active');
}

// Walk With Kamerad Receipt Generator (Prefix #NC-)
async function submitTripRegistrationWA(event) {
  event.preventDefault();
  if (!selectedTripForRegistration) return;

  const paxCount = document.getElementById('tripPaxCount') ? document.getElementById('tripPaxCount').value : '1';
  const pName = document.getElementById('tripParticipantName').value.trim();
  const pPhone = document.getElementById('tripParticipantPhone').value.trim();
  const tripNotes = document.getElementById('tripNotes') ? document.getElementById('tripNotes').value.trim() : '';

  if (!pName || !pPhone) {
    showToast('Silakan lengkapi Nama dan Nomor WhatsApp Anda.', 'warning');
    return;
  }

  const orderId = await fetchNextDailyOrderCode('NC');

  let waText = '';
  waText += `👣 *Walk With Kamerad*\n`;
  waText += `—————————\n\n`;
  waText += `📋 *Order ID:* #${orderId}\n`;
  waText += `🏔️ *Ekspedisi:* ${selectedTripForRegistration.title}\n`;
  waText += `🗓️ *Jadwal:* ${selectedTripForRegistration.dateRange}\n`;
  waText += `💰 *Biaya:* ${formatRupiah(selectedTripForRegistration.price)} / pax\n\n`;
  waText += `👤 *Jumlah Peserta:* ${paxCount} Peserta\n`;
  waText += `👤 *Nama Ketua:* ${pName}\n`;
  waText += `📱 *WhatsApp:* ${pPhone}\n`;
  if (tripNotes) {
    waText += `📌 *Catatan:* ${tripNotes}\n`;
  }
  waText += `\n—————————\n`;
  waText += `Kamerad Web App`;

  closeOpenTripConfirmModal();
  showToast('Membuka WhatsApp Basecamp...', 'success');
  openWhatsAppURL(waText);
}

// Render K-Shop Catalog Grid (With Shop Cart Support!)
function renderForSaleCatalog() {
  const grid = document.getElementById('forSaleGrid');
  if (!grid) return;

  grid.innerHTML = FOR_SALE_ITEMS.map(item => {
    const displayName = currentLang === 'id' ? (item.name_id || item.name) : item.name;
    const displaySpecs = currentLang === 'id' ? (item.specs_id || item.specs) : item.specs;

    return `
      <div class="service-card">
        <div class="card-img-container">
          <div class="promo-card-badge" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">K-SHOP ITEM</div>
          <img src="${item.image}" alt="${displayName}" class="card-img" loading="lazy">
        </div>
        <div class="card-body">
          <h3 class="card-title">${displayName}</h3>
          <div class="card-specs-row">
            ${displaySpecs.map(s => `<span class="spec-chip">${s}</span>`).join('')}
          </div>
          <div class="card-pricing-row">
            <div class="price-box">
              <span class="rental-rate">${formatRupiah(item.price)}</span>
            </div>
          </div>
          <div class="card-actions" style="margin-top: 0.5rem;">
            <button class="btn-primary" onclick="addSaleItemToCart('${item.id}')" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 100%;">
              🛒 ${currentLang === 'id' ? 'Tambah ke K-Shop' : 'Add to K-Shop'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Laundry Services Grid (With Timing Options Modal!)
function renderLaundryServices() {
  const grid = document.getElementById('laundryGrid');
  if (!grid) return;

  grid.innerHTML = LAUNDRY_SERVICES.map(srv => {
    const displayName = currentLang === 'id' ? (srv.name_id || srv.name) : srv.name;
    const displayDesc = currentLang === 'id' ? (srv.desc_id || srv.desc) : srv.desc;

    return `
      <div class="service-card">
        <div class="card-img-container">
          <div class="category-card-badge" style="background: rgba(59, 130, 246, 0.85); color: #fff;">LAUNDRY & CARE</div>
          <img src="${srv.image}" alt="${displayName}" class="card-img" loading="lazy">
        </div>
        <div class="card-body">
          <h3 class="card-title">${displayName}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">${displayDesc}</p>
          <div style="font-size: 0.8rem; color: #60a5fa; font-weight: 700; margin-top: 4px;">
            ⏱️ Standard: 3 Hari (Drop-off ➔ Selesai Otomatis +3 Hari)
          </div>
          <div class="card-pricing-row">
            <div class="price-box">
              <span class="rental-rate">${formatRupiah(srv.price)}</span>
            </div>
          </div>
          <div class="card-actions" style="margin-top: 0.5rem;">
            <button class="btn-primary" onclick="openLaundryBookingModal('${srv.id}')" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); width: 100%;">
              🧼 ${currentLang === 'id' ? 'Pilih Waktu & Tambah ke Laundry' : 'Select Date & Add to Laundry'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Laundry Booking Modal Handlers
function openLaundryBookingModal(serviceId) {
  const service = LAUNDRY_SERVICES.find(s => s.id === serviceId);
  if (!service) return;

  selectedLaundryService = service;
  selectedLaundryDropOffDate = formatDateInput(new Date());

  const modalBackdrop = document.getElementById('laundryBookingModal');
  renderLaundryModalContent();
  modalBackdrop.classList.add('active');
}

function closeLaundryBookingModal() {
  const modalBackdrop = document.getElementById('laundryBookingModal');
  if (modalBackdrop) modalBackdrop.classList.remove('active');
}

function getCalculatedLaundryPickUpDate(dropOffStr) {
  const dropDate = new Date(dropOffStr);
  const pickDate = new Date(dropDate);
  pickDate.setDate(pickDate.getDate() + 3);
  return formatDateInput(pickDate);
}

function updateLaundryDropOffDate(newDateVal) {
  selectedLaundryDropOffDate = newDateVal;
  renderLaundryModalContent();
}

function renderLaundryModalContent() {
  const modalBody = document.getElementById('laundryBookingModalBody');
  if (!modalBody || !selectedLaundryService) return;

  const displayName = currentLang === 'id' ? (selectedLaundryService.name_id || selectedLaundryService.name) : selectedLaundryService.name;
  const displayDesc = currentLang === 'id' ? (selectedLaundryService.desc_id || selectedLaundryService.desc) : selectedLaundryService.desc;
  const pickUpDateStr = formatReceiptDate(getCalculatedLaundryPickUpDate(selectedLaundryDropOffDate));
  const dropOffDateStr = formatReceiptDate(selectedLaundryDropOffDate);

  modalBody.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="display: flex; gap: 0.85rem; background: var(--bg-card); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); align-items: center;">
        <img src="${selectedLaundryService.image}" alt="${displayName}" style="width: 76px; height: 76px; object-fit: cover; border-radius: var(--radius-sm);">
        <div>
          <span style="font-size: 0.72rem; color: #60a5fa; font-weight: 800;">🧼 LAYANAN LAUNDRY & CARE</span>
          <h4 style="font-size: 1rem; color: #fff; margin: 2px 0;">${displayName}</h4>
          <p style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${displayDesc}</p>
          <div style="font-size: 0.9rem; font-weight: 800; color: var(--green-success); margin-top: 2px;">${formatRupiah(selectedLaundryService.price)} / unit</div>
        </div>
      </div>

      <!-- Laundry Timing Options -->
      <div class="payment-choice-box" style="margin-bottom: 0;">
        <span class="payment-choice-title">⏱️ Opsi Kecepatan / Waktu Laundry</span>
        <div class="payment-options-grid" style="grid-template-columns: 1fr 1fr;">
          <label class="payment-radio-card selected" style="border-color: #60a5fa;">
            <input type="radio" name="laundryOption" value="standard" checked>
            <span class="payment-opt-name" style="color: #60a5fa;">Standard (3 Hari)</span>
            <span class="payment-opt-sub">Drop-off hari ini, selesai 3 hari kemudian</span>
          </label>

          <label class="payment-radio-card" style="opacity: 0.65; cursor: not-allowed; position: relative;">
            <input type="radio" name="laundryOption" value="express" disabled>
            <span class="payment-opt-name">Express (3 Jam)</span>
            <span class="payment-opt-sub" style="color: var(--amber-warning); font-weight: 700;">🚀 Available Soon</span>
          </label>
        </div>
      </div>

      <!-- Date Pickers -->
      <div style="background: var(--bg-card); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle); display: flex; flex-direction: column; gap: 0.75rem;">
        <div class="input-field-wrapper">
          <label for="laundryDropOffInput">📅 Tanggal Antar Alat (Drop Off Date) *</label>
          <input type="date" id="laundryDropOffInput" class="date-input" value="${selectedLaundryDropOffDate}" onchange="updateLaundryDropOffDate(this.value)" min="${formatDateInput(new Date())}">
        </div>

        <div style="background: rgba(96, 165, 250, 0.1); border: 1px solid rgba(96, 165, 250, 0.3); padding: 0.65rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.85rem; color: #93c5fd; display: flex; align-items: center; justify-content: space-between;">
          <span>✨ <strong>Tanggal Selesai (Pick Up):</strong></span>
          <strong style="color: #fff; font-size: 0.95rem;">${pickUpDateStr} (Otomatis +3 Hari)</strong>
        </div>
      </div>

      <!-- Actions -->
      <div style="margin-top: 0.25rem;">
        <button type="button" class="btn-primary" onclick="addConfiguredLaundryToCart()" style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none;">
          🛒 Tambah ke Laundry Cart
        </button>
      </div>
    </div>
  `;
}

function addConfiguredLaundryToCart() {
  if (!selectedLaundryService) return;

  const rawPickUpStr = getCalculatedLaundryPickUpDate(selectedLaundryDropOffDate);
  const pickUpDateStr = formatReceiptDate(rawPickUpStr);
  const dropOffDateStr = formatReceiptDate(selectedLaundryDropOffDate);
  const displayName = currentLang === 'id' ? (selectedLaundryService.name_id || selectedLaundryService.name) : selectedLaundryService.name;

  const existingInCart = cart.find(c => c.id === selectedLaundryService.id);
  if (existingInCart) {
    existingInCart.qty += 1;
    existingInCart.dropOffDate = dropOffDateStr;
    existingInCart.pickUpDate = pickUpDateStr;
  } else {
    cart.push({
      id: selectedLaundryService.id,
      name: selectedLaundryService.name,
      name_id: selectedLaundryService.name_id,
      price: selectedLaundryService.price,
      priceBase2Days: selectedLaundryService.price,
      image: selectedLaundryService.image,
      itemType: 'laundry',
      timingOption: 'Standard (3 Hari)',
      dropOffDate: dropOffDateStr,
      pickUpDate: pickUpDateStr,
      qty: 1
    });
  }

  activeCartTab = 'laundry';
  closeLaundryBookingModal();
  updateCartUI();
  document.getElementById('cartBackdrop').classList.add('active');
  showToast(`Layanan "${displayName}" ditambahkan ke Laundry Cart!`, 'success');
}

// Add Rental Gear to Cart
function addToCart(itemId) {
  const itemObj = GEAR_CATALOG.find(i => i.id === itemId);
  if (!itemObj) return;

  const displayName = currentLang === 'id' ? (itemObj.name_id || itemObj.name) : itemObj.name;

  if (itemObj.stock <= 0) {
    const msg = currentLang === 'id' ? `Maaf, "${displayName}" sedang habis!` : `Sorry, "${displayName}" is out of stock!`;
    showToast(msg, 'warning');
    return;
  }

  const existingInCart = cart.find(c => c.id === itemId);
  if (existingInCart) {
    if (existingInCart.qty + 1 > itemObj.stock) {
      const msg = currentLang === 'id' ? `Stok terbatas! Hanya tersisa ${itemObj.stock} unit.` : `Maximum stock (${itemObj.stock}) reached!`;
      showToast(msg, 'warning');
      return;
    }
    existingInCart.qty += 1;
  } else {
    cart.push({ ...itemObj, qty: 1, itemType: 'rental' });
  }

  activeCartTab = 'rental';
  updateCartUI();
  const successMsg = currentLang === 'id' ? `"${displayName}" ditambahkan ke Rental Cart!` : `Added "${displayName}" to Rental Cart!`;
  showToast(successMsg, 'success');
}

// Add For Sale Item to K-Shop Cart
function addSaleItemToCart(itemId) {
  const item = FOR_SALE_ITEMS.find(i => i.id === itemId);
  if (!item) return;

  const displayName = currentLang === 'id' ? (item.name_id || item.name) : item.name;
  const existingInCart = cart.find(c => c.id === itemId);
  if (existingInCart) {
    existingInCart.qty += 1;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      name_id: item.name_id,
      price: item.price,
      priceBase2Days: item.price,
      image: item.image,
      itemType: 'sale',
      qty: 1
    });
  }

  activeCartTab = 'sale';
  updateCartUI();
  const msg = currentLang === 'id' ? `"${displayName}" ditambahkan ke K-Shop Cart!` : `Added "${displayName}" to K-Shop Cart!`;
  showToast(msg, 'success');
}

// Customer Auth Modal Toggle
function openAuthModal(tab = 'login') {
  switchAuthTab(tab);
  document.getElementById('customerAuthModal').classList.add('active');
}

function closeAuthModal() {
  document.getElementById('customerAuthModal').classList.remove('active');
}

function switchAuthTab(tab) {
  const loginBtn = document.getElementById('tabCustomerLoginBtn');
  const regBtn = document.getElementById('tabCustomerRegisterBtn');
  const loginForm = document.getElementById('customerLoginForm');
  const regForm = document.getElementById('customerRegisterForm');

  if (tab === 'login') {
    loginBtn.classList.add('active');
    regBtn.classList.remove('active');
    loginForm.style.display = 'block';
    regForm.style.display = 'none';
  } else {
    regBtn.classList.add('active');
    loginBtn.classList.remove('active');
    loginForm.style.display = 'none';
    regForm.style.display = 'block';
  }
}

// Local Registered Accounts Storage Backup
let localUsers = JSON.parse(localStorage.getItem('kmrd_registered_users') || '[]');

// Email Verification Modal Controls
function openEmailVerificationNoticeModal(targetEmail) {
  const modal = document.getElementById('emailVerificationModal');
  const targetEmailEl = document.getElementById('verificationTargetEmail');
  const simBtn = document.getElementById('btnSimulateEmailClick');

  if (targetEmailEl) targetEmailEl.innerText = targetEmail;

  if (simBtn) {
    simBtn.onclick = async () => {
      await processEmailVerification(targetEmail);
    };
  }

  if (modal) modal.classList.add('active');
}

function closeEmailVerificationModal() {
  const modal = document.getElementById('emailVerificationModal');
  if (modal) modal.classList.remove('active');
}

// Process Email Verification: UNCONFIRMED -> CONFIRMED
async function processEmailVerification(email) {
  if (!email) return;

  // 1. Update in Supabase Database
  if (supabaseClient) {
    try {
      await supabaseClient
        .from('customers')
        .update({ status: 'CONFIRMED' })
        .eq('email', email.toLowerCase());
    } catch (err) {
      console.error('Supabase customer verification error:', err);
    }
  }

  // 2. Update in Local Storage
  const userInLocal = localUsers.find(u => u.email === email.toLowerCase());
  if (userInLocal) {
    userInLocal.status = 'CONFIRMED';
    localStorage.setItem('kmrd_registered_users', JSON.stringify(localUsers));
  }

  closeEmailVerificationModal();
  openAuthModal('login');

  const loginInput = document.getElementById('loginEmailInput');
  if (loginInput) loginInput.value = email;

  showToast(`✅ Email Berhasil Terverifikasi! Status akun Anda di database sekarang CONFIRMED. Silakan Login.`, 'success');
}

// Hash Listener for #verify-email?email=...
async function checkEmailVerificationURL() {
  const hash = window.location.hash || '';
  if (hash.includes('verify-email')) {
    const queryString = hash.split('?')[1] || '';
    const urlParams = new URLSearchParams(queryString);
    const email = urlParams.get('email');
    if (email) {
      await processEmailVerification(email);
      window.history.replaceState(null, null, window.location.pathname);
    }
  }
}

window.addEventListener('hashchange', checkEmailVerificationURL);

// Handle Customer Register with UNCONFIRMED status
async function handleCustomerRegister(event) {
  event.preventDefault();
  const username = document.getElementById('regUsernameInput') ? document.getElementById('regUsernameInput').value.trim().toLowerCase() : '';
  const name = document.getElementById('regNameInput').value.trim();
  const phone = document.getElementById('regPhoneInput').value.trim();
  const email = document.getElementById('regEmailInput').value.trim().toLowerCase();
  const password = document.getElementById('regPasswordInput').value;

  if (!username || !name || !phone || !email || !password) {
    showToast('Silakan lengkapi Username, Nama, WhatsApp, Email, dan Password.', 'warning');
    return;
  }

  if (password.length < 6) {
    showToast('Password minimal harus 6 karakter!', 'warning');
    return;
  }

  // Check if Username or Email already exists locally
  const existingLocal = localUsers.find(u => u.email === email || u.username === username);
  if (existingLocal) {
    showToast('❌ Email atau Username ini sudah terdaftar! Silakan Login.', 'warning');
    switchAuthTab('login');
    return;
  }

  // Check Supabase Database for existing account
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('customers')
        .select('*')
        .or(`email.eq.${email},username.eq.${username}`);

      if (!error && data && data.length > 0) {
        showToast('❌ Email atau Username ini sudah terdaftar! Silakan Login.', 'warning');
        switchAuthTab('login');
        return;
      }
    } catch (err) {
      console.error('Error checking existing customer in Supabase:', err);
    }
  }

  // Create User Account Record with status UNCONFIRMED
  const newUserRecord = {
    username,
    name,
    phone,
    email,
    password,
    status: 'UNCONFIRMED',
    created_at: new Date().toISOString()
  };

  // 1. Save to Local Storage
  localUsers.push(newUserRecord);
  localStorage.setItem('kmrd_registered_users', JSON.stringify(localUsers));

  // 2. Save Customer Profile to Supabase Database (Status: UNCONFIRMED)
  if (supabaseClient) {
    try {
      await supabaseClient.from('customers').upsert([newUserRecord], { onConflict: 'email' });
    } catch (err) {
      console.error('Supabase customer register error:', err);
    }
  }

  closeAuthModal();
  openEmailVerificationNoticeModal(email);

  showToast(`📩 Link verifikasi dikirim ke ${email}. Status akun: UNCONFIRMED`, 'info');
}

// Handle Customer Login (Requires Status CONFIRMED)
async function handleCustomerLogin(event) {
  event.preventDefault();
  const inputIdentifier = document.getElementById('loginEmailInput').value.trim().toLowerCase();
  const inputPassword = document.getElementById('loginPasswordInput').value;

  if (!inputIdentifier || !inputPassword) {
    showToast('Silakan isi Email/Username dan Password Anda.', 'warning');
    return;
  }

  let foundUser = null;

  // 1. Check Local Registered Users List
  foundUser = localUsers.find(u => (u.email === inputIdentifier || u.username === inputIdentifier) && u.password === inputPassword);

  // 2. Check Supabase Database if not found locally
  if (!foundUser && supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('customers')
        .select('*')
        .or(`email.eq.${inputIdentifier},username.eq.${inputIdentifier}`);

      if (!error && data && data.length > 0) {
        const matched = data.find(u => (u.email === inputIdentifier || u.username === inputIdentifier) && u.password === inputPassword);
        if (matched) {
          foundUser = matched;
        }
      }
    } catch (err) {
      console.error('Supabase customer login query error:', err);
    }
  }

  // STRICT CREDENTIAL VERIFICATION: Reject if unregistered or wrong password
  if (!foundUser) {
    showToast('❌ Login Gagal! Email/Username atau Password salah. Silakan periksa atau Daftar Akun baru.', 'warning');
    return;
  }

  // VERIFICATION GUARD: Reject Login if Status is UNCONFIRMED!
  const isConfirmed = (foundUser.status === 'CONFIRMED' || foundUser.status === 'CONFIRMED_USER' || foundUser.status === 'ACTIVE');
  if (!isConfirmed) {
    showToast('⚠️ Akun Anda belum terverifikasi! Status di database: UNCONFIRMED. Silakan konfirmasi email Anda terlebih dahulu.', 'warning');
    openEmailVerificationNoticeModal(foundUser.email);
    return;
  }

  // Successful Login
  currentCustomer = { username: foundUser.username, name: foundUser.name, phone: foundUser.phone, email: foundUser.email };
  localStorage.setItem('kmrd_customer_session', JSON.stringify(currentCustomer));

  closeAuthModal();
  renderNavAuthButtons();

  const custNameInput = document.getElementById('custNameInput');
  const custPhoneInput = document.getElementById('custPhoneInput');
  if (custNameInput) custNameInput.value = currentCustomer.name || '';
  if (custPhoneInput && currentCustomer.phone) custPhoneInput.value = currentCustomer.phone;

  showToast(`✅ Berhasil masuk sebagai ${currentCustomer.name}!`, 'success');

  // Auto proceed to checkout if user has items in cart
  if (cart.length > 0) {
    openCheckoutModal();
  }
}

function handleCustomerLogout() {
  currentCustomer = null;
  localStorage.removeItem('kmrd_customer_session');
  renderNavAuthButtons();
  showToast('Telah keluar dari akun.', 'info');
}

// Customer Bookings History Modal
async function openCustomerBookingsModal() {
  if (!currentCustomer) {
    openAuthModal('login');
    return;
  }

  const modal = document.getElementById('customerBookingsModal');
  const body = document.getElementById('customerBookingsListBody');
  body.innerHTML = `<p style="text-align: center; color: var(--text-muted);">Memuat riwayat booking...</p>`;
  modal.classList.add('active');

  let userBookings = [];

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('rentals')
        .select('*, rental_items(*, items(*))')
        .or(`customer_email.eq.${currentCustomer.email},customer_phone.eq.${currentCustomer.phone}`)
        .order('created_at', { ascending: false });

      if (!error && data) userBookings = data;
    } catch (err) {
      console.error('Error fetching customer bookings:', err);
    }
  }

  if (userBookings.length === 0) {
    userBookings = localBookings.filter(b => b.customerEmail === currentCustomer.email || b.phone === currentCustomer.phone);
  }

  if (userBookings.length === 0) {
    body.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 1rem auto; opacity: 0.4;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        <p style="font-weight: 600;">Belum ada riwayat booking rental.</p>
      </div>
    `;
    return;
  }

  body.innerHTML = userBookings.map(b => {
    const statusColor = b.status === 'CONFIRMED' ? 'var(--green-success)' : b.status === 'CANCELLED' ? 'var(--red-primary)' : 'var(--amber-warning)';
    const statusBadge = b.status === 'CONFIRMED' ? '✅ DIKONFIRMASI' : b.status === 'CANCELLED' ? '❌ DIBATALKAN' : '⏳ MENUNGGU KONFIRMASI';

    return `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; border-bottom: 1px dashed var(--border-subtle); padding-bottom: 0.5rem;">
          <div>
            <strong style="color: #fff; font-size: 1rem;">Order #${b.order_code || b.orderId}</strong>
            <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">(${b.start_date || b.startDate} ➔ ${b.end_date || b.endDate})</span>
          </div>
          <span style="font-size: 0.78rem; font-weight: 800; color: ${statusColor}; background: rgba(255,255,255,0.05); padding: 3px 10px; border-radius: 99px;">
            ${statusBadge}
          </span>
        </div>

        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.5rem;">
          <strong>Metode:</strong> ${b.payment_method || b.paymentMethod} | <strong>Total:</strong> <strong style="color: #fff;">${formatRupiah(b.grand_total || b.grandTotal)}</strong>
        </p>

        <div style="font-size: 0.82rem; color: var(--text-main);">
          <strong>Item:</strong> ${b.items || 'Peralatan sewa'}
        </div>
      </div>
    `;
  }).join('');
}

function closeCustomerBookingsModal() {
  document.getElementById('customerBookingsModal').classList.remove('active');
}

// Staff & Admin Auth Handler
function openAdminDashboardModal() {
  const modal = document.getElementById('adminDashboardModal');
  const loginForm = document.getElementById('adminLoginForm');
  const dashboardView = document.getElementById('adminDashboardView');

  if (isAdminLoggedIn) {
    loginForm.style.display = 'none';
    dashboardView.style.display = 'block';
    fetchAdminBookingsAndStock();
  } else {
    loginForm.style.display = 'block';
    dashboardView.style.display = 'none';
  }

  modal.classList.add('active');
}

function closeAdminDashboardModal() {
  document.getElementById('adminDashboardModal').classList.remove('active');
}

function handleAdminLogin(event) {
  event.preventDefault();
  const usernameInput = document.getElementById('adminUsernameInput').value.trim();
  const passwordInput = document.getElementById('adminPasswordInput').value.trim();

  if (usernameInput === ADMIN_USERNAME_CRED && passwordInput === ADMIN_PASSWORD_CRED) {
    isAdminLoggedIn = true;
    sessionStorage.setItem('kmrd_admin_session', 'true');

    document.getElementById('adminLoginForm').style.display = 'none';
    document.getElementById('adminDashboardView').style.display = 'block';

    renderNavAuthButtons();
    fetchAdminBookingsAndStock();
    showToast('Login Admin berhasil!', 'success');
  } else {
    showToast('Username atau Password Admin salah!', 'warning');
  }
}

function handleAdminLogout() {
  isAdminLoggedIn = false;
  sessionStorage.removeItem('kmrd_admin_session');
  renderNavAuthButtons();
  closeAdminDashboardModal();
  showToast('Telah keluar dari Portal Staff Admin.', 'info');
}

// Fetch All Bookings & Stock for Admin Dashboard
async function fetchAdminBookingsAndStock() {
  const tbody = document.getElementById('adminBookingsTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Memuat data booking dari database...</td></tr>`;

  let bookings = [];

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('rentals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) bookings = data;
    } catch (err) {
      console.error('Error fetching admin bookings:', err);
    }
  }

  if (bookings.length === 0) {
    bookings = localBookings;
  }

  const filteredBookings = bookings.filter(b => adminFilterStatus === 'ALL' || b.status === adminFilterStatus);

  if (filteredBookings.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Belum ada data pesanan sewa.</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredBookings.map(b => {
    const statusColor = b.status === 'CONFIRMED' ? 'var(--green-success)' : b.status === 'CANCELLED' ? 'var(--red-primary)' : 'var(--amber-warning)';
    const orderId = b.order_code || b.orderId;
    const dbId = b.id;

    return `
      <tr style="border-bottom: 1px solid var(--border-subtle);">
        <td style="padding: 0.75rem;"><strong>#${orderId}</strong></td>
        <td style="padding: 0.75rem;">
          <div><strong>${b.customer_name || b.customerName}</strong></div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${b.customer_phone || b.phone}</span>
        </td>
        <td style="padding: 0.75rem;">${b.start_date || b.startDate} ➔ ${b.end_date || b.endDate}</td>
        <td style="padding: 0.75rem;">
          <div><strong>${formatRupiah(b.grand_total || b.grandTotal)}</strong></div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${b.payment_method || b.paymentMethod}</span>
        </td>
        <td style="padding: 0.75rem;">
          <span style="font-weight: 800; color: ${statusColor}; font-size: 0.78rem;">${b.status}</span>
        </td>
        <td style="padding: 0.75rem; text-align: right;">
          <div style="display: flex; gap: 4px; justify-content: flex-end;">
            ${b.status !== 'CONFIRMED' ? `<button class="btn-primary" style="padding: 2px 8px; font-size: 0.75rem; background: var(--green-success);" onclick="updateBookingStatusAdmin('${dbId || orderId}', 'CONFIRMED')">Konfirmasi ✅</button>` : ''}
            ${b.status !== 'CANCELLED' ? `<button class="btn-secondary" style="padding: 2px 8px; font-size: 0.75rem; color: var(--red-primary);" onclick="updateBookingStatusAdmin('${dbId || orderId}', 'CANCELLED')">Batalkan ❌</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Filter Admin Bookings
function filterAdminBookings(status) {
  adminFilterStatus = status;
  document.querySelectorAll('#adminDashboardModal .filter-tab-btn').forEach(btn => btn.classList.remove('active'));

  if (status === 'ALL') document.getElementById('btnFilterAllBookings').classList.add('active');
  if (status === 'PENDING') document.getElementById('btnFilterPendingBookings').classList.add('active');
  if (status === 'CONFIRMED') document.getElementById('btnFilterConfirmedBookings').classList.add('active');
  if (status === 'CANCELLED') document.getElementById('btnFilterCancelledBookings').classList.add('active');

  fetchAdminBookingsAndStock();
}

// Admin Update Booking Status
async function updateBookingStatusAdmin(rentalId, newStatus) {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.rpc('admin_update_rental_status', {
        p_rental_id: rentalId,
        p_new_status: newStatus
      });

      if (error) throw error;
      fetchItemsFromSupabase();
      showToast(`Status booking berhasil diubah ke ${newStatus}!`, 'success');
    } catch (err) {
      console.error('Error updating status in Supabase:', err);
    }
  }

  const localOrder = localBookings.find(b => b.id === rentalId || b.orderId === rentalId);
  if (localOrder) localOrder.status = newStatus;

  fetchAdminBookingsAndStock();
}

// Set up Date Picker Inputs
function setupDatePickers() {
  const startInput = document.getElementById('startDateInput');
  const endInput = document.getElementById('endDateInput');

  if (startInput && endInput) {
    startInput.value = rentalDates.startDate;
    endInput.value = rentalDates.endDate;
    startInput.min = formatDateInput(new Date());

    startInput.addEventListener('change', (e) => {
      rentalDates.startDate = e.target.value;
      if (new Date(rentalDates.endDate) <= new Date(rentalDates.startDate)) {
        const nextDay = new Date(rentalDates.startDate);
        nextDay.setDate(nextDay.getDate() + 2);
        rentalDates.endDate = formatDateInput(nextDay);
        endInput.value = rentalDates.endDate;
      }
      validateCODDateRule();
      updateCartUI();
    });

    endInput.addEventListener('change', (e) => {
      rentalDates.endDate = e.target.value;
      updateCartUI();
    });
  }
}

// Validate COD Rule
function validateCODDateRule() {
  const todayStr = formatDateInput(new Date());
  const codWarningBox = document.getElementById('codWarningNotice');

  if (paymentSelection.method === 'cod') {
    if (rentalDates.startDate === todayStr) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      rentalDates.startDate = formatDateInput(tomorrow);
      document.getElementById('startDateInput').value = rentalDates.startDate;

      const msg = currentLang === 'id' ? 'Pengambilan COD disesuaikan ke besok (Kebijakan Basecamp)' : 'COD pickup adjusted to tomorrow (Basecamp Policy)';
      showToast(msg, 'warning');
    }
    if (codWarningBox) codWarningBox.style.display = 'flex';
  } else {
    if (codWarningBox) codWarningBox.style.display = 'none';
  }
}

// Render Equipment Catalog Grid
function renderCatalog() {
  const gridContainer = document.getElementById('equipmentGrid');
  if (!gridContainer) return;

  const t = TRANSLATIONS[currentLang];
  gridContainer.innerHTML = '';

  const filteredItems = GEAR_CATALOG.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const itemName = currentLang === 'id' ? (item.name_id || item.name) : item.name;
    const itemSpecs = currentLang === 'id' ? (item.specs_id || item.specs) : item.specs;
    const matchesSearch = itemName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
                          itemSpecs.some(s => s.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (filteredItems.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 1rem auto; opacity: 0.5;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <h3>${currentLang === 'id' ? 'Tidak ada peralatan yang sesuai pencarian' : 'No gear found matching your search'}</h3>
      </div>
    `;
    return;
  }

  filteredItems.forEach(item => {
    const cardEl = document.createElement('div');
    cardEl.className = `gear-card ${item.stock === 0 ? 'out-of-stock' : ''}`;

    const displayName = currentLang === 'id' ? (item.name_id || item.name) : item.name;
    const displayPromoTag = currentLang === 'id' ? (item.promoTag_id || item.promoTag) : item.promoTag;
    const displaySpecs = currentLang === 'id' ? (item.specs_id || item.specs) : item.specs;

    const promoBadgeHTML = item.isPromo 
      ? `<div class="promo-card-badge">🔥 ${displayPromoTag}</div>` 
      : '';

    const categoryBadgeText = item.category.toUpperCase();

    const originalPriceHTML = item.originalPrice 
      ? `<span class="original-price">${formatRupiah(item.originalPrice)}</span>` 
      : '';

    let stockBadgeHTML = '';
    if (item.stock > 3) {
      stockBadgeHTML = `<span class="stock-status-badge in-stock">${t.stock_in_stock} (${item.stock})</span>`;
    } else if (item.stock > 0) {
      stockBadgeHTML = `<span class="stock-status-badge low-stock">${t.stock_low_stock} ${item.stock}!</span>`;
    } else {
      stockBadgeHTML = `<span class="stock-status-badge no-stock">${t.stock_no_stock}</span>`;
    }

    cardEl.innerHTML = `
      <div class="card-img-container">
        ${promoBadgeHTML}
        <div class="category-card-badge">${categoryBadgeText}</div>
        <img src="${item.image}" alt="${displayName}" class="card-img" loading="lazy">
      </div>
      <div class="card-body">
        <h3 class="card-title">${displayName}</h3>
        <div class="card-specs-row">
          ${displaySpecs.slice(0, 3).map(spec => `<span class="spec-chip">${spec}</span>`).join('')}
        </div>
        <div class="card-pricing-row">
          <div class="price-box">
            ${originalPriceHTML}
            <div>
              <span class="rental-rate">${formatRupiah(item.priceBase2Days)}</span>
              <span class="rental-unit">${t.rate_unit_base}</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--red-primary); font-weight: 600;">+${formatRupiah(item.priceExtraDay)} ${t.rate_unit_extra}</span>
          </div>
          ${stockBadgeHTML}
        </div>
        <div class="card-actions">
          <button class="btn-secondary" onclick="openQuickView('${item.id}')">${t.btn_specs}</button>
          <button class="btn-primary" onclick="addToCart('${item.id}')" ${item.stock === 0 ? 'disabled' : ''}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            ${item.stock === 0 ? t.btn_out_of_stock : t.btn_add_rental}
          </button>
        </div>
      </div>
    `;

    gridContainer.appendChild(cardEl);
  });
}

// Remove item from Cart
function removeFromCart(itemId) {
  cart = cart.filter(i => i.id !== itemId);
  updateCartUI();
}

// Change Cart Quantity
function changeQty(itemId, delta) {
  const cartItem = cart.find(c => c.id === itemId);
  const catalogItem = GEAR_CATALOG.find(i => i.id === itemId);

  if (!cartItem) return;

  if (cartItem.itemType === 'rental' && delta > 0 && catalogItem && cartItem.qty + 1 > catalogItem.stock) {
    const msg = currentLang === 'id' ? `Batas maksimum stok (${catalogItem.stock})!` : `Maximum available stock (${catalogItem.stock}) reached!`;
    showToast(msg, 'warning');
    return;
  }

  cartItem.qty += delta;
  if (cartItem.qty <= 0) {
    removeFromCart(itemId);
  } else {
    updateCartUI();
  }
}

// Update Cart UI Drawer & Category Tab Calculations
function updateCartUI() {
  const cartBadge = document.getElementById('cartBadgeCount');
  const cartItemsList = document.getElementById('cartItemsList');
  const t = TRANSLATIONS[currentLang];

  // 1. Badge Counts for each category
  const rentCount = cart.filter(i => (!i.itemType || i.itemType === 'rental')).reduce((sum, i) => sum + i.qty, 0);
  const laundryCount = cart.filter(i => i.itemType === 'laundry').reduce((sum, i) => sum + i.qty, 0);
  const saleCount = cart.filter(i => i.itemType === 'sale').reduce((sum, i) => sum + i.qty, 0);
  const totalItemCount = rentCount + laundryCount + saleCount;

  if (cartBadge) cartBadge.innerText = totalItemCount;

  // Update Cart Drawer Tab Badges
  const rentBadgeEl = document.getElementById('cartRentBadge');
  const laundryBadgeEl = document.getElementById('cartLaundryBadge');
  const saleBadgeEl = document.getElementById('cartSaleBadge');

  if (rentBadgeEl) rentBadgeEl.innerText = rentCount;
  if (laundryBadgeEl) laundryBadgeEl.innerText = laundryCount;
  if (saleBadgeEl) saleBadgeEl.innerText = saleCount;

  // Highlight Active Cart Tab Button
  const btnRent = document.getElementById('cartTabRent');
  const btnLaundry = document.getElementById('cartTabLaundry');
  const btnSale = document.getElementById('cartTabSale');

  if (btnRent) btnRent.classList.toggle('active', activeCartTab === 'rental');
  if (btnLaundry) btnLaundry.classList.toggle('active', activeCartTab === 'laundry');
  if (btnSale) btnSale.classList.toggle('active', activeCartTab === 'sale');

  // Filter Cart Items based on activeCartTab
  const activeTabItems = cart.filter(i => (i.itemType || 'rental') === activeCartTab);

  // 2. Dynamic Overview Card & Payment Choice Box per Category
  const datesCard = document.querySelector('.cart-dates-card');
  const paymentBox = document.querySelector('.payment-choice-box');
  const dpRow = document.getElementById('summaryDPAmountRow');
  const balanceRow = document.getElementById('summaryBalanceRow');
  const subtotalRow = document.getElementById('summarySubtotal');
  const grandTotalRow = document.getElementById('summaryGrandTotal');
  const checkoutBtnSpan = document.querySelector('#cartBackdrop .cart-footer button span');

  const durationDays = getRentalDurationDays();
  const activeTabTotal = activeTabItems.reduce((sum, item) => sum + getItemTotalCost(item, durationDays), 0);

  if (activeCartTab === 'rental') {
    if (datesCard) {
      datesCard.style.display = 'block';
      datesCard.innerHTML = `
        <div class="cart-dates-header">
          <span data-i18n="cart_duration_header">📅 DURASI SEWA ALAT</span>
          <span style="background: rgba(239, 68, 68, 0.2); color: #fff; padding: 2px 8px; border-radius: 4px; font-weight: 800;" id="rentalDurationDaysLabel">${durationDays} Days</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Tanggal sewa: <strong>${rentalDates.startDate} ➔ ${rentalDates.endDate}</strong> (${durationDays} Hari)</p>
      `;
    }

    if (paymentBox) {
      paymentBox.style.display = 'block';
      paymentBox.innerHTML = `
        <span class="payment-choice-title">💳 Pilih Metode Pembayaran Booking</span>
        <div class="payment-options-grid">
          <label class="payment-radio-card ${paymentSelection.method === 'dp' ? 'selected' : ''}" id="dpRadioCard" onclick="selectPaymentMethod('rental', 'dp')">
            <input type="radio" name="paymentOption" value="dp" ${paymentSelection.method === 'dp' ? 'checked' : ''}>
            <span class="payment-opt-name">Down Payment (50%)</span>
            <span class="payment-opt-sub">Kunci booking dengan DP</span>
          </label>
          <label class="payment-radio-card ${paymentSelection.method === 'cod' ? 'selected' : ''}" id="codRadioCard" onclick="selectPaymentMethod('rental', 'cod')">
            <input type="radio" name="paymentOption" value="cod" ${paymentSelection.method === 'cod' ? 'checked' : ''}>
            <span class="payment-opt-name">Full COD</span>
            <span class="payment-opt-sub">Bayar di Basecamp</span>
          </label>
        </div>
        ${paymentSelection.method === 'dp' ? `
          <div style="margin-top: 0.4rem; display: flex; flex-direction: column; gap: 0.3rem;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.8rem; color: var(--text-muted);">Metode Pembayaran DP:</span>
              <select id="rentalDpMethodSelect" onchange="paymentSelection.rentalDpMethod = this.value" style="background: var(--bg-main); color: #fff; border: 1px solid var(--border-subtle); border-radius: 4px; padding: 2px 6px; font-size: 0.82rem; font-weight: 700;">
                <option value="Transfer BCA" ${paymentSelection.rentalDpMethod === 'Transfer BCA' ? 'selected' : ''}>Transfer BCA</option>
                <option value="QRIS" ${paymentSelection.rentalDpMethod === 'QRIS' ? 'selected' : ''}>Scan QRIS</option>
              </select>
            </div>
          </div>
        ` : ''}
      `;
    }

    const dpAmount = Math.round(activeTabTotal * (paymentSelection.dpPercent / 100));
    const balanceAmount = activeTabTotal - dpAmount;

    if (subtotalRow) {
      subtotalRow.innerText = durationDays <= 2 ? t.base_rate_text : `${t.base_rate_text} + ${durationDays - 2} ${t.extra_days_text}`;
    }
    if (grandTotalRow) grandTotalRow.innerText = formatRupiah(activeTabTotal);

    if (paymentSelection.method === 'dp') {
      if (dpRow) {
        dpRow.style.display = 'flex';
        dpRow.querySelector('span:last-child').innerText = `${formatRupiah(dpAmount)} (${paymentSelection.dpPercent}%)`;
      }
      if (balanceRow) {
        balanceRow.style.display = 'flex';
        balanceRow.querySelector('span:first-child').innerText = 'Sisa Bayar saat Pengambilan:';
        balanceRow.querySelector('span:last-child').innerText = formatRupiah(balanceAmount);
      }
    } else {
      if (dpRow) dpRow.style.display = 'none';
      if (balanceRow) {
        balanceRow.style.display = 'flex';
        balanceRow.querySelector('span:first-child').innerText = 'Jumlah COD di Basecamp:';
        balanceRow.querySelector('span:last-child').innerText = `${formatRupiah(activeTabTotal)} (Full COD)`;
      }
    }

    if (checkoutBtnSpan) checkoutBtnSpan.innerText = 'Lanjut Checkout Rental →';

  } else if (activeCartTab === 'laundry') {
    if (datesCard) {
      datesCard.style.display = 'block';
      const sampleLaundry = activeTabItems.find(i => i.dropOffDate);
      const dropStr = sampleLaundry ? sampleLaundry.dropOffDate : formatReceiptDate(formatDateInput(new Date()));
      const pickStr = sampleLaundry ? sampleLaundry.pickUpDate : formatReceiptDate(getCalculatedLaundryPickUpDate(formatDateInput(new Date())));

      datesCard.innerHTML = `
        <div class="cart-dates-header">
          <span style="color: #60a5fa; font-weight: 800;">⏱️ JADWAL LAUNDRY & CARE</span>
          <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 8px; border-radius: 4px; font-weight: 800;">Standard (3 Hari)</span>
        </div>
        <p style="font-size: 0.8rem; color: #93c5fd; margin-top: 4px;">Tanggal Antar (Drop Off): <strong>${dropStr}</strong> ➔ Selesai (Pick Up): <strong>${pickStr}</strong></p>
      `;
    }

    if (paymentBox) {
      paymentBox.style.display = 'block';
      paymentBox.innerHTML = `
        <span class="payment-choice-title">💳 Pilih Metode Transaksi Laundry</span>
        <div class="payment-options-grid" style="grid-template-columns: 1fr 1fr 1fr;">
          <label class="payment-radio-card ${paymentSelection.laundryMethod === 'dropoff_cash' ? 'selected' : ''}" onclick="selectPaymentMethod('laundry', 'dropoff_cash')">
            <input type="radio" name="laundryPayOption" value="dropoff_cash" ${paymentSelection.laundryMethod === 'dropoff_cash' ? 'checked' : ''}>
            <span class="payment-opt-name" style="color: #60a5fa; font-size: 0.78rem;">Cash On Drop-off</span>
            <span class="payment-opt-sub">Bayar saat drop-off</span>
          </label>
          <label class="payment-radio-card ${paymentSelection.laundryMethod === 'transfer' ? 'selected' : ''}" onclick="selectPaymentMethod('laundry', 'transfer')">
            <input type="radio" name="laundryPayOption" value="transfer" ${paymentSelection.laundryMethod === 'transfer' ? 'checked' : ''}>
            <span class="payment-opt-name" style="color: #60a5fa; font-size: 0.78rem;">Transfer</span>
            <span class="payment-opt-sub">Transfer bank</span>
          </label>
          <label class="payment-radio-card ${paymentSelection.laundryMethod === 'qris' ? 'selected' : ''}" onclick="selectPaymentMethod('laundry', 'qris')">
            <input type="radio" name="laundryPayOption" value="qris" ${paymentSelection.laundryMethod === 'qris' ? 'checked' : ''}>
            <span class="payment-opt-name" style="color: #60a5fa; font-size: 0.78rem;">QRIS</span>
            <span class="payment-opt-sub">Scan QRIS Basecamp</span>
          </label>
        </div>
      `;
    }

    if (dpRow) dpRow.style.display = 'none';
    if (balanceRow) {
      balanceRow.style.display = 'flex';
      balanceRow.querySelector('span:first-child').innerText = 'Metode Transaksi:';
      let lStr = 'Cash On Drop-off';
      if (paymentSelection.laundryMethod === 'transfer') lStr = 'Transfer Bank';
      if (paymentSelection.laundryMethod === 'qris') lStr = 'Scan QRIS Basecamp';
      balanceRow.querySelector('span:last-child').innerText = lStr;
    }

    if (subtotalRow) subtotalRow.innerText = 'Tarif Cuci & Care';
    if (grandTotalRow) grandTotalRow.innerText = formatRupiah(activeTabTotal);
    if (checkoutBtnSpan) checkoutBtnSpan.innerText = 'Lanjut Checkout Laundry →';

  } else if (activeCartTab === 'sale') {
    if (datesCard) {
      datesCard.style.display = 'block';
      datesCard.innerHTML = `
        <div class="cart-dates-header">
          <span style="color: var(--green-success); font-weight: 800;">🏷️ PEMBELIAN K-SHOP</span>
          <span style="background: rgba(16, 185, 129, 0.2); color: var(--green-success); padding: 2px 8px; border-radius: 4px; font-weight: 800;">K-Shop</span>
        </div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Produk outdoor original & aksesoris gunung siap pakai.</p>
      `;
    }

    if (paymentBox) {
      paymentBox.style.display = 'block';
      paymentBox.innerHTML = `
        <span class="payment-choice-title">💳 Metode Transaksi K-Shop</span>
        <div class="payment-options-grid" style="margin-bottom: 0.6rem;">
          <label class="payment-radio-card ${paymentSelection.kshopMethod === 'transfer' ? 'selected' : ''}" onclick="selectPaymentMethod('kshop', 'transfer')">
            <input type="radio" name="kshopPayOption" value="transfer" ${paymentSelection.kshopMethod === 'transfer' ? 'checked' : ''}>
            <span class="payment-opt-name" style="color: var(--green-success);">Transfer / QRIS</span>
            <span class="payment-opt-sub">Transfer atau scan QRIS</span>
          </label>
          <label class="payment-radio-card ${paymentSelection.kshopMethod === 'cod' ? 'selected' : ''}" onclick="selectPaymentMethod('kshop', 'cod')">
            <input type="radio" name="kshopPayOption" value="cod" ${paymentSelection.kshopMethod === 'cod' ? 'checked' : ''}>
            <span class="payment-opt-name" style="color: var(--green-success);">Tunai di Basecamp</span>
            <span class="payment-opt-sub">Bayar tunai di lokasi</span>
          </label>
        </div>

        <span class="payment-choice-title">🚚 Metode Pengiriman</span>
        <div class="payment-options-grid">
          <label class="payment-radio-card ${paymentSelection.kshopDelivery === 'pickup' ? 'selected' : ''}" onclick="selectKShopDelivery('pickup')">
            <input type="radio" name="kshopDelivOption" value="pickup" ${paymentSelection.kshopDelivery === 'pickup' ? 'checked' : ''}>
            <span class="payment-opt-name" style="color: var(--green-success);">Self Pickup</span>
            <span class="payment-opt-sub">Ambil sendiri di Basecamp</span>
          </label>
          <label class="payment-radio-card ${paymentSelection.kshopDelivery === 'courier' ? 'selected' : ''}" onclick="selectKShopDelivery('courier')">
            <input type="radio" name="kshopDelivOption" value="courier" ${paymentSelection.kshopDelivery === 'courier' ? 'checked' : ''}>
            <span class="payment-opt-name" style="color: var(--green-success);">Via Kurir</span>
            <span class="payment-opt-sub">Kirim ke alamat penerima</span>
          </label>
        </div>
      `;
    }

    if (dpRow) dpRow.style.display = 'none';
    if (balanceRow) {
      balanceRow.style.display = 'flex';
      balanceRow.querySelector('span:first-child').innerText = 'Pengiriman & Pembayaran:';
      const delivText = paymentSelection.kshopDelivery === 'courier' ? 'Via Kurir' : 'Self Pickup';
      const payText = paymentSelection.kshopMethod === 'cod' ? 'Tunai di Basecamp' : 'Transfer / QRIS';
      balanceRow.querySelector('span:last-child').innerText = `${delivText} (${payText})`;
    }

    if (subtotalRow) subtotalRow.innerText = 'Total Produk';
    if (grandTotalRow) grandTotalRow.innerText = formatRupiah(activeTabTotal);
    if (checkoutBtnSpan) checkoutBtnSpan.innerText = 'Lanjut Checkout K-Shop →';
  }

  // 3. Render Items List for Active Tab
  if (!cartItemsList) return;

  if (activeTabItems.length === 0) {
    const tabName = activeCartTab === 'rental' ? 'Rental Cart' : activeCartTab === 'laundry' ? 'Laundry Cart' : 'K-Shop Cart';
    cartItemsList.innerHTML = `
      <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
        <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 0.75rem auto; opacity: 0.4;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
        </svg>
        <p style="font-weight: 600;">${tabName} Anda kosong</p>
      </div>
    `;
    return;
  }

  cartItemsList.innerHTML = activeTabItems.map(item => {
    const displayName = currentLang === 'id' ? (item.name_id || item.name) : item.name;
    const itemTotal = getItemTotalCost(item, durationDays);

    let typeBadgeHTML = `<span class="spec-chip" style="background: rgba(239, 68, 68, 0.15); color: var(--red-primary); font-size: 0.65rem; font-weight: 800;">RENTAL</span>`;
    let rateDetailText = `${formatRupiah(item.priceBase2Days)} / 2 Days`;

    if (item.itemType === 'sale') {
      typeBadgeHTML = `<span class="spec-chip" style="background: rgba(16, 185, 129, 0.15); color: var(--green-success); font-size: 0.65rem; font-weight: 800;">K-SHOP</span>`;
      rateDetailText = `${formatRupiah(item.price)} / item`;
    } else if (item.itemType === 'laundry') {
      typeBadgeHTML = `<span class="spec-chip" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-size: 0.65rem; font-weight: 800;">LAUNDRY</span>`;
      rateDetailText = `${formatRupiah(item.price)} (Drop: ${item.dropOffDate} ➔ Pick: ${item.pickUpDate})`;
    } else if (durationDays > 2) {
      rateDetailText += ` (+${durationDays - 2}x ${formatRupiah(item.priceExtraDay)})`;
    }

    return `
      <div class="cart-item-row">
        <img src="${item.image}" alt="${displayName}" class="cart-item-img">
        <div class="cart-item-info">
          <div style="display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
            ${typeBadgeHTML}
            <span class="cart-item-name">${displayName}</span>
          </div>
          <span class="cart-item-rate" style="font-size: 0.76rem;">${rateDetailText}</span>
          <span style="font-weight: 700; color: #fff;">${formatRupiah(itemTotal)}</span>
        </div>
        <div class="qty-controls">
          <button class="btn-qty" onclick="changeQty('${item.id}', -1)">-</button>
          <span class="qty-val">${item.qty}</span>
          <button class="btn-qty" onclick="changeQty('${item.id}', 1)">+</button>
        </div>
      </div>
    `;
  }).join('');
}

// Event Listeners Setup
function setupEventListeners() {
  document.querySelectorAll('.filter-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      renderCatalog();
    });
  });

  const searchInput = document.getElementById('catalogSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchKeyword = e.target.value;
      renderCatalog();
    });
  }

  const cartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartBackdrop = document.getElementById('cartBackdrop');

  if (cartBtn) cartBtn.addEventListener('click', () => cartBackdrop.classList.add('active'));
  if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartBackdrop.classList.remove('active'));
}

// Quick View Modal
function openQuickView(itemId) {
  const item = GEAR_CATALOG.find(i => i.id === itemId);
  if (!item) return;

  const displayName = currentLang === 'id' ? (item.name_id || item.name) : item.name;
  const displayDesc = currentLang === 'id' ? (item.description_id || item.description) : item.description;
  const displaySpecs = currentLang === 'id' ? (item.specs_id || item.specs) : item.specs;
  const t = TRANSLATIONS[currentLang];

  const modalBackdrop = document.getElementById('quickViewModal');
  const modalBody = document.getElementById('quickViewModalBody');

  modalBody.innerHTML = `
    <div class="quickview-grid">
      <img src="${item.image}" alt="${displayName}" class="quickview-img">
      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        <span class="badge-tag">${item.category.toUpperCase()}</span>
        <h2 style="font-size: 1.5rem;">${displayName}</h2>
        <p style="color: var(--text-muted); font-size: 0.9rem;">${displayDesc}</p>
        
        <div style="background: var(--bg-card); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <span style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">${currentLang === 'id' ? 'Spesifikasi Teknikal:' : 'Technical Specifications:'}</span>
          <ul style="margin-top: 0.5rem; padding-left: 1.2rem; color: var(--text-main); font-size: 0.88rem;">
            ${displaySpecs.map(s => `<li>${s}</li>`).join('')}
            <li>${currentLang === 'id' ? 'Tarif Sewa' : 'Rental Rates'}: <strong>${formatRupiah(item.priceBase2Days)} ${t.rate_unit_base}</strong> (+${formatRupiah(item.priceExtraDay)}${t.rate_unit_extra})</li>
            <li>${currentLang === 'id' ? 'Stok Tersedia' : 'Available Stock'}: <strong>${item.stock}</strong></li>
          </ul>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto;">
          <div>
            <span style="font-size: 1.4rem; font-weight: 900; color: #fff;">${formatRupiah(item.priceBase2Days)}</span>
            <span style="color: var(--text-muted); font-size: 0.85rem;"> ${t.rate_unit_base}</span>
          </div>
          <button class="btn-primary" onclick="addToCart('${item.id}'); closeQuickView();" ${item.stock === 0 ? 'disabled' : ''}>
            ${item.stock === 0 ? t.btn_out_of_stock : t.btn_add_rental}
          </button>
        </div>
      </div>
    </div>
  `;

  modalBackdrop.classList.add('active');
}

function closeQuickView() {
  document.getElementById('quickViewModal').classList.remove('active');
}

// Modal Toggle Handlers
function openCheckoutModal() {
  const activeTabItems = cart.filter(i => (i.itemType || 'rental') === activeCartTab);
  if (activeTabItems.length === 0) {
    const tabName = activeCartTab === 'rental' ? 'Rental Cart' : activeCartTab === 'laundry' ? 'Laundry Cart' : 'K-Shop Cart';
    showToast(`${tabName} Anda kosong!`, 'warning');
    return;
  }

  // MANDATORY LOGIN GUARD: Require Account Login Before Checkout
  if (!currentCustomer) {
    showToast('Silakan Login / Daftar Akun terlebih dahulu sebelum Checkout!', 'warning');
    openAuthModal('login');
    return;
  }

  validateCODDateRule();

  const destWrapper = document.getElementById('custDestinationWrapper');
  const addrWrapper = document.getElementById('custAddressWrapper');
  const destInput = document.getElementById('custDestinationInput');
  const addrInput = document.getElementById('custAddressInput');

  if (activeCartTab === 'rental') {
    if (destWrapper) destWrapper.style.display = 'block';
    if (destInput) destInput.required = true;
    if (addrWrapper) addrWrapper.style.display = 'none';
    if (addrInput) addrInput.required = false;
  } else if (activeCartTab === 'sale') {
    if (destWrapper) destWrapper.style.display = 'none';
    if (destInput) destInput.required = false;

    if (paymentSelection.kshopDelivery === 'courier') {
      if (addrWrapper) addrWrapper.style.display = 'block';
      if (addrInput) addrInput.required = true;
    } else {
      if (addrWrapper) addrWrapper.style.display = 'none';
      if (addrInput) addrInput.required = false;
    }
  } else {
    // Laundry
    if (destWrapper) destWrapper.style.display = 'none';
    if (destInput) destInput.required = false;
    if (addrWrapper) addrWrapper.style.display = 'none';
    if (addrInput) addrInput.required = false;
  }

  document.getElementById('cartBackdrop').classList.remove('active');

  if (currentCustomer) {
    const custNameInput = document.getElementById('custNameInput');
    const custPhoneInput = document.getElementById('custPhoneInput');
    if (custNameInput && !custNameInput.value) custNameInput.value = currentCustomer.name;
    if (custPhoneInput && !custPhoneInput.value) custPhoneInput.value = currentCustomer.phone;
  }

  document.getElementById('checkoutModal').classList.add('active');
}

function closeCheckoutModal() {
  document.getElementById('checkoutModal').classList.remove('active');
}

// Submit Order: Exact WhatsApp Receipt Formatting per User Specifications
async function submitOrderAndOpenWhatsApp(event) {
  event.preventDefault();

  const activeTabItems = cart.filter(i => (i.itemType || 'rental') === activeCartTab);

  if (activeTabItems.length === 0) {
    showToast('Keranjang kategori ini kosong!', 'warning');
    return;
  }

  const nameInput = document.getElementById('custNameInput').value.trim();
  const phoneInput = document.getElementById('custPhoneInput').value.trim();
  const destinationInput = document.getElementById('custDestinationInput') ? document.getElementById('custDestinationInput').value.trim() : '';
  const addressInput = document.getElementById('custAddressInput') ? document.getElementById('custAddressInput').value.trim() : '';
  const notesInput = document.getElementById('custNotesInput') ? document.getElementById('custNotesInput').value.trim() : '';
  const customerEmail = currentCustomer ? currentCustomer.email : '';

  if (!nameInput || !phoneInput) {
    const msg = currentLang === 'id' ? 'Silakan isi Nama dan Nomor WhatsApp Anda.' : 'Please provide your Name and WhatsApp number.';
    showToast(msg, 'warning');
    return;
  }

  if (activeCartTab === 'rental' && !destinationInput) {
    showToast('Silakan isi Destinasi Gunung Tujuan Anda.', 'warning');
    return;
  }

  if (activeCartTab === 'sale' && paymentSelection.kshopDelivery === 'courier' && !addressInput) {
    showToast('Silakan isi Alamat Lengkap Penerima untuk Pengiriman Kurir.', 'warning');
    return;
  }

  const durationDays = getRentalDurationDays();
  const grandTotal = activeTabItems.reduce((sum, item) => sum + getItemTotalCost(item, durationDays), 0);
  const dpAmount = Math.round(grandTotal * (paymentSelection.dpPercent / 100));
  const balanceAmount = paymentSelection.method === 'dp' ? (grandTotal - dpAmount) : grandTotal;

  // Exact Receipts and Order ID Prefixes
  let waText = '';

  if (activeCartTab === 'laundry') {
    // Prefix #SW-
    const orderId = await fetchNextDailyOrderCode('SW');

    let laundryPayStr = 'Cash On Drop-off';
    if (paymentSelection.laundryMethod === 'transfer') laundryPayStr = 'Transfer';
    if (paymentSelection.laundryMethod === 'qris') laundryPayStr = 'QRIS';

    const sampleLaundry = activeTabItems.find(i => i.dropOffDate);
    const dropStr = sampleLaundry ? sampleLaundry.dropOffDate : formatReceiptDate(formatDateInput(new Date()));
    const pickStr = sampleLaundry ? sampleLaundry.pickUpDate : formatReceiptDate(getCalculatedLaundryPickUpDate(formatDateInput(new Date())));

    waText += `🧼 Kamerad Equipment Care\n`;
    waText += `—————————\n\n`;
    waText += `📋 *Order ID* : #${orderId}\n`;
    waText += `👤 *Pemesan* : ${nameInput}\n`;
    waText += `📱 *WhatsApp* : ${phoneInput}\n\n`;
    waText += `🧺 *Services* : \n`;
    activeTabItems.forEach(item => {
      const displayName = item.name_id || item.name;
      const itemTotal = getItemTotalCost(item, durationDays);
      waText += `• ${displayName} x${item.qty} (${formatRupiah(itemTotal)})\n`;
    });
    waText += `\n📅 *Drop Off* : ${dropStr}\n`;
    waText += `📅 *Pick Up* : ${pickStr}\n\n`;
    waText += `💰 *Total Biaya* : ${formatRupiah(grandTotal)}\n`;
    waText += `💳 *Metode Transaksi* : ${laundryPayStr}\n`;
    waText += `📌 *Catatan* : ${notesInput || '-'}\n\n`;
    waText += `—————————\n`;
    waText += `Kamerad Web App`;

  } else if (activeCartTab === 'rental') {
    // Prefix #CD-
    const orderId = await fetchNextDailyOrderCode('CD');
    const startFormatted = formatReceiptDate(rentalDates.startDate);
    const endFormatted = formatReceiptDate(rentalDates.endDate);

    const rentalDpMethodLabel = paymentSelection.rentalDpMethod || 'Transfer BCA';
    const payMethodLabel = paymentSelection.method === 'dp' 
      ? `Down Payment (50%) - ${rentalDpMethodLabel}` 
      : 'Full COD / Tunai di Basecamp';

    waText += `🏕️ *Rental Booking- Kamerad Basecamp*\n`;
    waText += `—————————\n\n`;
    waText += `📋 *Order ID:* #${orderId}\n`;
    waText += `👤 *Penyewa :* ${nameInput}\n`;
    waText += `📱 *WhatsApp :* ${phoneInput}\n`;
    waText += `⛰️ *Destinasi :* ${destinationInput}\n`;
    waText += `📅 *Tanggal Sewa :* ${startFormatted} ➔ ${endFormatted} (${durationDays} Hari)\n\n`;
    waText += `🎒 *Item :* \n`;
    activeTabItems.forEach(item => {
      const displayName = item.name_id || item.name;
      const itemTotal = getItemTotalCost(item, durationDays);
      waText += `• ${displayName} x${item.qty} (${formatRupiah(itemTotal)})\n`;
    });
    waText += `\n💳 *Pembayaran Booking :* ${payMethodLabel}\n`;
    waText += `💰 *Total Biaya Sewa :* ${formatRupiah(grandTotal)}\n`;
    if (paymentSelection.method === 'dp') {
      waText += `💸 *Down Payment ${paymentSelection.dpPercent}% :* ${formatRupiah(dpAmount)}\n`;
      waText += `💸 *Sisa Bayar saat Pengambilan :* ${formatRupiah(balanceAmount)}\n`;
    }
    waText += `📌 *Catatan:* ${notesInput || `Pengambilan barang di Basecamp pada tanggal ${rentalDates.startDate}`}\n\n`;
    waText += `—————————\n`;
    waText += `Kamerad Web App`;

  } else if (activeCartTab === 'sale') {
    // Prefix #SS-
    const orderId = await fetchNextDailyOrderCode('SS');
    const todayFormatted = formatReceiptDate(formatDateInput(new Date()));

    const kshopPayStr = paymentSelection.kshopMethod === 'cod' ? 'Tunai di Basecamp' : 'Transfer / QRIS';
    const deliveryStr = paymentSelection.kshopDelivery === 'courier' ? 'Via Kurir' : 'Self Pickup';

    waText += `🏷️ *K-Shop*\n`;
    waText += `—————————\n\n`;
    waText += `📋 *Order ID:* #${orderId}\n`;
    waText += `👤 *Buyer:* ${nameInput}\n`;
    waText += `📱 *WhatsApp:* ${phoneInput}\n`;
    waText += `📅 *Purchase Date:* ${todayFormatted}\n\n`;
    waText += `🛒 *Items:* \n`;
    activeTabItems.forEach(item => {
      const displayName = item.name_id || item.name;
      const itemTotal = getItemTotalCost(item, durationDays);
      waText += `• ${displayName} x${item.qty} (${formatRupiah(itemTotal)})\n`;
    });
    waText += `\n💰 *Total Pembelian:* ${formatRupiah(grandTotal)}\n`;
    waText += `💳 *Metode Transaksi:* ${kshopPayStr}\n`;
    waText += `🚚 *Metode Pengiriman:* ${deliveryStr}\n`;
    if (paymentSelection.kshopDelivery === 'courier') {
      waText += `📍 *Alamat Penerima:* ${addressInput}\n`;
    }
    waText += `📌 *Catatan:* ${notesInput || '-'}\n\n`;
    waText += `—————————\n`;
    waText += `Kamerad Web App`;
  }

  // 1. Silent Booking Log in Supabase
  const finalOrderId = waText.match(/Order ID[^\n]*#([A-Z0-9-]+)/)?.[1] || 'CD-ORDER';
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.rpc('process_rental_booking', {
        p_order_code: finalOrderId,
        p_customer_name: nameInput,
        p_customer_phone: phoneInput,
        p_customer_email: customerEmail,
        p_start_date: activeCartTab === 'rental' ? rentalDates.startDate : null,
        p_end_date: activeCartTab === 'rental' ? rentalDates.endDate : null,
        p_duration_days: activeCartTab === 'rental' ? durationDays : 0,
        p_payment_method: activeCartTab === 'rental' ? paymentSelection.method : (activeCartTab === 'laundry' ? paymentSelection.laundryMethod : paymentSelection.kshopMethod),
        p_grand_total: grandTotal,
        p_dp_amount: dpAmount,
        p_balance_amount: balanceAmount,
        p_notes: `Destinasi: ${destinationInput} | Alamat: ${addressInput} | ${notesInput}`,
        p_items: activeTabItems.map(c => ({ id: c.id, name: c.name, qty: c.qty, itemType: c.itemType || 'rental', itemTotal: getItemTotalCost(c, durationDays), image: c.image }))
      });

      if (error) throw error;
    } catch (err) {
      console.error('Supabase booking logging error:', err);
    }
  }

  // Backup in Local Storage
  localBookings.unshift({
    orderId: finalOrderId,
    customerName: nameInput,
    phone: phoneInput,
    customerEmail,
    destination: destinationInput,
    startDate: activeCartTab === 'rental' ? rentalDates.startDate : 'N/A',
    endDate: activeCartTab === 'rental' ? rentalDates.endDate : 'N/A',
    durationDays: activeCartTab === 'rental' ? durationDays : 0,
    paymentMethod: activeCartTab === 'rental' ? paymentSelection.method : (activeCartTab === 'laundry' ? paymentSelection.laundryMethod : paymentSelection.kshopMethod),
    grandTotal,
    dpAmount,
    balanceAmount,
    status: 'PENDING',
    items: activeTabItems.map(c => `[${(c.itemType || 'rental').toUpperCase()}] ${c.name} (x${c.qty})`).join(', ')
  });
  localStorage.setItem('kmrd_local_bookings', JSON.stringify(localBookings));

  closeCheckoutModal();
  showToast('Pesanan dikonfirmasi! Membuka WhatsApp Basecamp...', 'success');

  // Remove checked out items from cart
  cart = cart.filter(i => (i.itemType || 'rental') !== activeCartTab);
  updateCartUI();

  // Instant Cross-Platform WhatsApp Redirect
  openWhatsAppURL(waText);
}

// Universal Cross-Platform WhatsApp Opener
function openWhatsAppURL(waText) {
  const encodedWA = encodeURIComponent(waText);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  const waURL = `https://wa.me/${BASECAMP_WHATSAPP_NUMBER}?text=${encodedWA}`;

  if (isIOS) {
    window.location.href = waURL;
  } else {
    const link = document.createElement('a');
    link.href = waURL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';

  const iconSVG = type === 'warning' 
    ? `<svg width="20" height="20" fill="none" stroke="var(--amber-warning)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`
    : `<svg width="20" height="20" fill="none" stroke="var(--green-success)" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;

  toast.innerHTML = `${iconSVG} <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Set Active Language
function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem('kmrd_lang', lang);

  const langCodeLabel = document.getElementById('currentLangLabelCode');
  if (langCodeLabel) langCodeLabel.innerText = lang.toUpperCase();

  const optID = document.getElementById('langOptID');
  const optEN = document.getElementById('langOptEN');
  if (optID && optEN) {
    optID.classList.toggle('active', lang === 'id');
    optEN.classList.toggle('active', lang === 'en');
  }

  document.documentElement.lang = lang;

  const t = TRANSLATIONS[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.innerHTML = t[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) el.placeholder = t[key];
  });

  renderNavAuthButtons();
  renderCarousel();
  renderCatalog();
  renderOpenTripsCatalog();
  renderForSaleCatalog();
  renderLaundryServices();
  updateCartUI();
}
