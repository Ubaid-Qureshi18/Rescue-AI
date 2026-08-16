import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'prisma/dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as any);

const departments = [
  { id: 'dept-ce', name: 'Computer Engineering & AI', location: 'Block A, Floor 2', building: 'Block A', color: '#7C3AED' },
  { id: 'dept-ec', name: 'Electronics & VLSI Lab', location: 'Block B, Floor 1', building: 'Block B', color: '#2563EB' },
  { id: 'dept-ds', name: 'Design & Architecture Studio', location: 'Block C, Floor 3', building: 'Block C', color: '#DB2777' },
  { id: 'dept-rb', name: 'Robotics & Autonomous Systems', location: 'Block D, Floor 1', building: 'Block D', color: '#D97706' },
  { id: 'dept-me', name: 'Mechanical & Advanced Fabrication', location: 'Block H, Heavy Workshop', building: 'Block H', color: '#EA580C' },
  { id: 'dept-bio', name: 'Biotech & Life Sciences', location: 'Block G, Floor 2', building: 'Block G', color: '#059669' },
  { id: 'dept-media', name: 'Media & XR Innovation Center', location: 'Block F, Floor 2', building: 'Block F', color: '#00D9A5' },
  { id: 'dept-lib', name: 'Central Library & Learning Hub', location: 'Block E, Floor 1', building: 'Block E', color: '#6366F1' },
];

const users = [
  { id: 'user-admin', name: 'Dr. Priya Sharma', email: 'admin@inspire.edu', role: 'ADMIN', departmentId: 'dept-ce' },
  { id: 'user-ce', name: 'Prof. Arjun Mehta', email: 'arjun@inspire.edu', role: 'RESOURCE_OWNER', departmentId: 'dept-ce' },
  { id: 'user-ec', name: 'Prof. Kavitha Reddy', email: 'kavitha@inspire.edu', role: 'RESOURCE_OWNER', departmentId: 'dept-ec' },
  { id: 'user-ds', name: 'Prof. Ravi Kumar', email: 'ravi@inspire.edu', role: 'RESOURCE_OWNER', departmentId: 'dept-ds' },
  { id: 'user-rb', name: 'Dr. Neha Gupta', email: 'neha@inspire.edu', role: 'RESOURCE_OWNER', departmentId: 'dept-rb' },
  { id: 'user-me', name: 'Prof. Sandeep Joshi', email: 'sandeep@inspire.edu', role: 'RESOURCE_OWNER', departmentId: 'dept-me' },
  { id: 'user-bio', name: 'Dr. Anirudh Sen', email: 'anirudh@inspire.edu', role: 'RESOURCE_OWNER', departmentId: 'dept-bio' },
  { id: 'user-media', name: 'Ananya Roy', email: 'ananya@inspire.edu', role: 'RESOURCE_OWNER', departmentId: 'dept-media' },
  { id: 'user-req', name: 'Sunita Patel', email: 'sunita@inspire.edu', role: 'REQUESTER', departmentId: 'dept-ce' },
  { id: 'user-sus', name: 'Vikram Singh', email: 'vikram@inspire.edu', role: 'SUSTAINABILITY', departmentId: 'dept-lib' },
];

const now = new Date();
const future = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

const resources = [
  // Computer Engineering & AI — High-Performance Compute & Laptops
  { id: 'res-lap-001', name: 'Dell Inspiron Laptop (i7/16GB/512GB)', category: 'Electronics', description: 'Intel Core i7, 16GB RAM, 512GB SSD - optimized for Python, Docker, data science workshops', quantity: 28, condition: 'Good', location: 'Lab 3, Room 203', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 55000, tags: 'laptop,computer,programming,workshop,dell', specifications: JSON.stringify({ processor: 'Intel Core i7 13th Gen', ram: '16GB DDR5', storage: '512GB NVMe SSD', os: 'Ubuntu 24.04 / Win 11 Dual Boot' }) },
  { id: 'res-lap-002', name: 'HP EliteBook 840 G9', category: 'Electronics', description: 'Intel Core i5, 16GB RAM, 512GB SSD - lightweight enterprise laptops for coding competitions', quantity: 20, condition: 'Good', location: 'Lab 4, Room 204', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 45000, tags: 'laptop,computer,programming,hp', specifications: JSON.stringify({ processor: 'Intel Core i5 12th Gen', ram: '16GB', storage: '512GB SSD', weight: '1.36kg' }) },
  { id: 'res-lap-003', name: 'Lenovo ThinkPad X1 Carbon', category: 'Electronics', description: 'Flagship business ultrabooks with 14" 2.8K OLED screen, ideal for AI research presentations', quantity: 14, condition: 'Excellent', location: 'Staff Room 101', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 85000, tags: 'laptop,thinkpad,research,premium', specifications: JSON.stringify({ processor: 'Intel Core i7 Evo', ram: '32GB', storage: '1TB SSD', display: 'OLED 2.8K' }) },
  { id: 'res-lap-004', name: 'Apple MacBook Pro 16" (M2 Pro/32GB)', category: 'Electronics', description: 'Apple Silicon M2 Pro developer laptops with ProRes accelerators for AI and mobile app teams', quantity: 12, condition: 'Excellent', location: 'Innovation Lab 105', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 185000, tags: 'laptop,macbook,apple,design,ai,ios', specifications: JSON.stringify({ processor: 'Apple M2 Pro (12-core)', ram: '32GB Unified', storage: '1TB SSD' }) },
  { id: 'res-gpu-001', name: 'NVIDIA Dual RTX 4090 AI Server', category: 'Electronics', description: 'Enterprise rackmount deep learning server with 48GB VRAM total for transformer LLM fine-tuning', quantity: 3, condition: 'Excellent', location: 'Server Room A0', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 650000, tags: 'gpu,nvidia,ai,deep learning,server,cluster', specifications: JSON.stringify({ gpu: '2x NVIDIA RTX 4090 24GB', cpu: 'AMD EPYC 32-core', ram: '128GB ECC', storage: '4TB NVMe Raid' }) },
  { id: 'res-switch-001', name: 'Cisco Catalyst 48-Port 10G PoE Switch', category: 'Electronics', description: 'High-density 10Gbps managed switch for hackathon networking and lab deployments', quantity: 6, condition: 'Good', location: 'Network Ops Center A1', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 55000, tags: 'network,switch,cisco,10g,poe', specifications: JSON.stringify({ ports: 48, speed: '10Gbps Uplink', poeBudget: '740W' }) },
  { id: 'res-starlink-001', name: 'Starlink Enterprise Satellite Terminal', category: 'Electronics', description: 'High-speed low-latency satellite dish with dual gigabit router for outdoor field events', quantity: 2, condition: 'Excellent', location: 'NOC Room A1', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 180000, tags: 'satellite,internet,starlink,network,outdoor', specifications: JSON.stringify({ downloadSpeed: '220Mbps', latency: '25ms', weatherRating: 'IP56' }) },

  // Electronics & VLSI Lab — Test Equipment, AV & Optics
  { id: 'res-proj-001', name: 'Epson Pro 4K Laser Projector (5000 Lumens)', category: 'Electronics', description: 'High-brightness 4K laser projector with wireless Miracast, HDMI 2.1, and ceiling mount', quantity: 8, condition: 'Excellent', location: 'AV Room 110', building: 'Block B', departmentId: 'dept-ec', status: 'AVAILABLE', estimatedValue: 48000, tags: 'projector,av,presentation,display,4k,laser', specifications: JSON.stringify({ resolution: '4K Enhancement', lumens: 5000, lampLife: '20000 hours', throwRatio: '1.32-2.24' }) },
  { id: 'res-proj-002', name: 'BenQ Short-Throw Interactive Projector', category: 'Electronics', description: 'Interactive pen-enabled short throw projector for classrooms and breakout rooms', quantity: 10, condition: 'Good', location: 'Equipment Store B2', building: 'Block B', departmentId: 'dept-ec', status: 'AVAILABLE', estimatedValue: 24000, tags: 'projector,short throw,interactive,classroom', specifications: JSON.stringify({ resolution: '1080p', throwDistance: '0.5m', lumens: 3500 }) },
  { id: 'res-mic-001', name: 'Sennheiser Wireless Vocal Mic Kit', category: 'Electronics', description: 'Dual UHF true-diversity wireless handheld & lapel microphones with feedback rejection', quantity: 14, condition: 'Good', location: 'AV Store B1', building: 'Block B', departmentId: 'dept-ec', status: 'AVAILABLE', estimatedValue: 22000, tags: 'microphone,audio,sennheiser,wireless,vocal', specifications: JSON.stringify({ frequency: 'UHF 500-800MHz', channels: 2, range: '120m', battery: '14 hours' }) },
  { id: 'res-cam-001', name: 'Sony FX3 Cinema Line 4K Camera', category: 'Electronics', description: 'Full-frame cinema 4K camera with XLR handle, 24-70mm GM lens and carbon tripod', quantity: 6, condition: 'Excellent', location: 'Media Lab B3', building: 'Block B', departmentId: 'dept-ec', status: 'AVAILABLE', estimatedValue: 240000, tags: 'camera,cinema,video,sony,4k,recording', specifications: JSON.stringify({ sensor: 'Full-frame 12.1MP', format: '4K 120fps 10-bit 4:2:2', lens: 'Sony FE 24-70mm f/2.8 GM' }) },
  { id: 'res-monitor-001', name: 'Dell UltraSharp 32" 4K USB-C Hub Monitor', category: 'Electronics', description: 'Color-accurate IPS Black 4K display with 90W PD charging and built-in KVM switch', quantity: 24, condition: 'Excellent', location: 'Lab 5, Room 205', building: 'Block B', departmentId: 'dept-ec', status: 'AVAILABLE', estimatedValue: 42000, tags: 'monitor,display,4k,dell,kvm,ultrasharp', specifications: JSON.stringify({ size: '32 inch', resolution: '3840x2160', colorGamut: '98% DCI-P3', kvm: true }) },
  { id: 'res-scope-001', name: 'Keysight 200MHz 4-Channel Digital Oscilloscope', category: 'Electronics', description: 'Precision mixed-signal oscilloscope for circuit debugging and embedded communications testing', quantity: 8, condition: 'Good', location: 'VLSI Lab B4', building: 'Block B', departmentId: 'dept-ec', status: 'AVAILABLE', estimatedValue: 85000, tags: 'oscilloscope,keysight,electronics,measurement,hardware', specifications: JSON.stringify({ bandwidth: '200MHz', channels: 4, sampleRate: '2GSa/s' }) },
  { id: 'res-spectrum-001', name: 'Keysight 3GHz RF Spectrum Analyzer', category: 'Electronics', description: 'RF and wireless protocol spectrum analyzer for 5G, BLE, Wi-Fi 6 antenna characterization', quantity: 3, condition: 'Excellent', location: 'RF Lab B5', building: 'Block B', departmentId: 'dept-ec', status: 'AVAILABLE', estimatedValue: 320000, tags: 'spectrum analyzer,rf,wireless,5g,keysight', specifications: JSON.stringify({ freqRange: '9kHz - 3.0GHz', danl: '-161dBm', trackingGenerator: true }) },

  // Design & Architecture Studio — Furniture, Drafting & Modeling
  { id: 'res-chair-001', name: 'Herman Miller Aeron Ergonomic Task Chair', category: 'Furniture', description: 'Top-tier ergonomic chairs with PostureFit SL back support and 3D armrests', quantity: 80, condition: 'Good', location: 'Storage Room C1', building: 'Block C', departmentId: 'dept-ds', status: 'AVAILABLE', estimatedValue: 7500, tags: 'chair,furniture,ergonomic,seating,herman miller', specifications: JSON.stringify({ type: 'Aeron Size B', material: 'Pellicle Mesh', weightCapacity: '159kg' }) },
  { id: 'res-chair-002', name: 'Stackable Padded Event Chairs', category: 'Furniture', description: 'Lightweight high-durability steel frame cushioned chairs for seminars and exhibitions', quantity: 200, condition: 'Good', location: 'Storage Room C2', building: 'Block C', departmentId: 'dept-ds', status: 'AVAILABLE', estimatedValue: 1500, tags: 'chair,furniture,folding,event,stackable', specifications: JSON.stringify({ type: 'Cushioned Stacking', frame: '18-gauge Steel', stackLimit: 15 }) },
  { id: 'res-table-001', name: 'Flip-Top Mobile Conference Tables (6ft)', category: 'Furniture', description: 'Nesting folding training tables with integrated dual power and USB charging grommets', quantity: 30, condition: 'Good', location: 'Storage Room C1', building: 'Block C', departmentId: 'dept-ds', status: 'AVAILABLE', estimatedValue: 14000, tags: 'table,furniture,conference,workshop,modular', specifications: JSON.stringify({ dimensions: '180x60cm', nesting: true, powerSockets: 4 }) },
  { id: 'res-whiteboard-001', name: 'Porcelain Double-Sided Pivot Whiteboard', category: 'Furniture', description: 'Non-ghosting ceramic magnetic mobile whiteboard (72" x 48") on locking caster wheels', quantity: 18, condition: 'Good', location: 'Storage Room C3', building: 'Block C', departmentId: 'dept-ds', status: 'AVAILABLE', estimatedValue: 9500, tags: 'whiteboard,presentation,teaching,magnetic', specifications: JSON.stringify({ size: '180x120cm', surface: 'Ceramic Steel', wheels: 'Heavy-duty PU' }) },
  { id: 'res-drafting-001', name: 'Adjustable Architectural Drafting Tables', category: 'Furniture', description: 'Tilting glass-top drafting and CAD modeling tables with LED backlighting', quantity: 12, condition: 'Excellent', location: 'Design Studio C2', building: 'Block C', departmentId: 'dept-ds', status: 'AVAILABLE', estimatedValue: 22000, tags: 'drafting,table,architecture,design,cad', specifications: JSON.stringify({ tiltRange: '0-60 degrees', surface: 'Tempered Safety Glass', ledBacklit: true }) },
  { id: 'res-podium-001', name: 'Digital Smart Lectern with Mic Array', category: 'Furniture', description: 'Acoustically isolated presentation podium with 24" touch monitor and gooseneck condenser mics', quantity: 4, condition: 'Excellent', location: 'Studio Storage C1', building: 'Block C', departmentId: 'dept-ds', status: 'AVAILABLE', estimatedValue: 52000, tags: 'podium,lectern,presentation,speech', specifications: JSON.stringify({ touchScreen: '24 inch Full HD', micType: 'Dual Condenser', motorizedHeight: true }) },
  { id: 'res-pod-001', name: 'Framery 6-Person Soundproof Ideation Pod', category: 'Space', description: 'Private acoustic collaborative meeting booth with air ventilation and interactive display', quantity: 2, condition: 'Excellent', location: 'Atrium C0', building: 'Block C', departmentId: 'dept-ds', status: 'AVAILABLE', estimatedValue: 220000, tags: 'booth,pod,soundproof,meeting,private', specifications: JSON.stringify({ capacity: 6, soundReduction: '32dB', powerSupply: 'Integrated Multi-Outlet' }) },

  // Robotics & Autonomous Systems — Prototyping & Edge Computing
  { id: 'res-arduino-001', name: 'Arduino Mega 2560 Advanced Sensor Kit', category: 'Electronics', description: 'Comprehensive microcontroller bundle with 50+ sensor modules, motor drivers, relays, and displays', quantity: 45, condition: 'Excellent', location: 'Workshop D1', building: 'Block D', departmentId: 'dept-rb', status: 'AVAILABLE', estimatedValue: 4800, tags: 'arduino,robotics,iot,embedded,workshop', specifications: JSON.stringify({ microcontroller: 'ATmega2560', gpioPins: 54, sensors: 52, includesCase: true }) },
  { id: 'res-rpi-001', name: 'Raspberry Pi 5 (8GB) Developer Kit', category: 'Electronics', description: 'Next-gen quad-core single-board computer with 64GB NVMe SSD, active cooler, and camera module', quantity: 30, condition: 'Excellent', location: 'Workshop D1', building: 'Block D', departmentId: 'dept-rb', status: 'AVAILABLE', estimatedValue: 11000, tags: 'raspberry pi,iot,linux,edge ai,robotics', specifications: JSON.stringify({ cpu: 'Cortex-A76 2.4GHz', ram: '8GB LPDDR4X', storage: '64GB PCIe NVMe' }) },
  { id: 'res-jetson-001', name: 'NVIDIA Jetson Orin Nano AI Kit', category: 'Electronics', description: 'Compact 40 TOPS edge AI developer kit for autonomous robotics and real-time computer vision', quantity: 12, condition: 'Excellent', location: 'Cabinet D3', building: 'Block D', departmentId: 'dept-rb', status: 'AVAILABLE', estimatedValue: 46000, tags: 'jetson,nvidia,edge ai,robotics,computer vision', specifications: JSON.stringify({ aiPerformance: '40 TOPS', gpu: 'NVIDIA Ampere 1024-core', memory: '8GB LPDDR5' }) },
  { id: 'res-drone-001', name: 'DJI Mavic 3 Enterprise Thermal Drone', category: 'Electronics', description: 'Dual-camera thermal inspection and aerial mapping drone with RTK positioning module', quantity: 4, condition: 'Good', location: 'Secure Vault D2', building: 'Block D', departmentId: 'dept-rb', status: 'AVAILABLE', estimatedValue: 185000, tags: 'drone,dji,thermal,aerial,mapping,robotics', specifications: JSON.stringify({ camera: '4/3 CMOS + Thermal', flightTime: '45 mins', range: '15km' }) },
  { id: 'res-3dprint-001', name: 'Bambu Lab X1-Carbon AMS 3D Printer', category: 'Capacity', description: 'Fast multi-color coreXY engineering 3D printer capable of printing carbon-fiber and nylon', quantity: 6, condition: 'Excellent', location: 'Fab Lab D3', building: 'Block D', departmentId: 'dept-rb', status: 'AVAILABLE', estimatedValue: 135000, tags: '3d printing,fabrication,prototyping,carbon fiber', specifications: JSON.stringify({ maxSpeed: '500mm/s', buildVolume: '256x256x256mm', nozzleTemp: '300°C', amsUnit: '4 Spools' }) },
  { id: 'res-soldering-001', name: 'Hakko FX-888D ESD Soldering Workbench', category: 'Electronics', description: 'Digital temperature-controlled soldering station with brass cleaner, fume extractor, and wire cutters', quantity: 25, condition: 'Good', location: 'Workshop D1', building: 'Block D', departmentId: 'dept-rb', status: 'AVAILABLE', estimatedValue: 5200, tags: 'soldering,electronics,hardware,esd,pcb', specifications: JSON.stringify({ tempRange: '200-480°C', heatingElement: 'Ceramic', esdSafe: true }) },
  { id: 'res-thermal-001', name: 'Fluke Ti480 PRO Industrial Thermal Imager', category: 'Electronics', description: '640x480 resolution thermal imaging camera for electrical panels and battery pack diagnostics', quantity: 2, condition: 'Excellent', location: 'Diagnostics Vault D1', building: 'Block D', departmentId: 'dept-rb', status: 'AVAILABLE', estimatedValue: 115000, tags: 'thermal,fluke,diagnostics,infrared,robotics', specifications: JSON.stringify({ detectorResolution: '640x480', thermalSensitivity: '0.05°C', frameRate: '60Hz' }) },

  // Mechanical & Advanced Fabrication — Heavy Prototyping & CNC
  { id: 'res-cnc-001', name: 'Haas Mini Mill 3-Axis Precision CNC', category: 'Capacity', description: 'High-speed 3-axis CNC vertical machining center for aluminum, brass, and composite milling', quantity: 1, condition: 'Excellent', location: 'CNC Bay H1', building: 'Block H', departmentId: 'dept-me', status: 'AVAILABLE', estimatedValue: 1850000, tags: 'cnc,machining,milling,haas,metal,mechanical', specifications: JSON.stringify({ travelX: '406mm', travelY: '305mm', spindleSpeed: '6000 RPM', toolCapacity: 10 }) },
  { id: 'res-waterjet-001', name: 'OMAX MicroMax Precision Abrasive Waterjet', category: 'Capacity', description: 'Sub-micron abrasive waterjet cutting system capable of slicing 50mm titanium, glass, and carbon fiber', quantity: 1, condition: 'Excellent', location: 'Heavy Machining H2', building: 'Block H', departmentId: 'dept-me', status: 'AVAILABLE', estimatedValue: 2800000, tags: 'waterjet,cutting,fabrication,titanium,omax', specifications: JSON.stringify({ tableSize: '700x700mm', accuracy: '0.005mm', pressure: '60,000 PSI' }) },
  { id: 'res-sla-001', name: 'Formlabs Form 4 SLA 3D Resin Printer', category: 'Capacity', description: 'Industrial SLA resin 3D printer for ultra-smooth engineering prototypes and biomedical fixtures', quantity: 3, condition: 'Excellent', location: 'Rapid Prototyping H3', building: 'Block H', departmentId: 'dept-me', status: 'AVAILABLE', estimatedValue: 380000, tags: 'sla,3d printing,formlabs,resin,precision', specifications: JSON.stringify({ layerThickness: '25-300 microns', buildVolume: '200x125x210mm', printSpeed: '100mm/hr' }) },
  { id: 'res-press-001', name: '10-Ton Hydraulic Workshop Forming Press', category: 'Capacity', description: 'Hydraulic shop press with dual pressure gauge for bearing insertion, bending, and sheet forming', quantity: 2, condition: 'Good', location: 'Metal Workshop H1', building: 'Block H', departmentId: 'dept-me', status: 'AVAILABLE', estimatedValue: 140000, tags: 'press,hydraulic,workshop,forming,mechanical', specifications: JSON.stringify({ maxForce: '10 Ton', ramStroke: '175mm', bedWidth: '500mm' }) },
  { id: 'res-welder-001', name: 'Lincoln Electric Square Wave TIG/MIG Welder', category: 'Capacity', description: 'Inverter TIG and stick welder with pulsed AC/DC for clean aluminum and stainless steel chassis fabrication', quantity: 4, condition: 'Good', location: 'Welding Bay H4', building: 'Block H', departmentId: 'dept-me', status: 'AVAILABLE', estimatedValue: 95000, tags: 'welder,tig,mig,aluminum,fabrication,lincoln', specifications: JSON.stringify({ currentRange: '10-200A', dutyCycle: '60% @ 130A', acFrequency: '20-200Hz' }) },

  // Biotech & Life Sciences — Analytical Instruments & Cold Storage
  { id: 'res-microscope-001', name: 'Olympus Binocular Fluorescence Microscope', category: 'Electronics', description: 'Research-grade binocular microscope with LED epifluorescence and digital 4K camera attachment', quantity: 8, condition: 'Excellent', location: 'Biotech Lab G1', building: 'Block G', departmentId: 'dept-bio', status: 'AVAILABLE', estimatedValue: 165000, tags: 'microscope,biotech,biology,imaging,olympus', specifications: JSON.stringify({ magnification: '40x-1000x', illumination: 'LED Koehler', camera: 'Sony CMOS 20MP' }) },
  { id: 'res-centrifuge-001', name: 'Eppendorf Refrigerated Microcentrifuge', category: 'Capacity', description: 'High-speed refrigerated centrifuge for DNA/RNA extraction and protein pelleting (17,000 RPM)', quantity: 4, condition: 'Good', location: 'Biotech Lab G2', building: 'Block G', departmentId: 'dept-bio', status: 'AVAILABLE', estimatedValue: 195000, tags: 'centrifuge,lab,biotech,cold storage', specifications: JSON.stringify({ maxSpeed: '17500 RPM', tempRange: '-11°C to +40°C', capacity: '24x 1.5/2.0mL tubes' }) },
  { id: 'res-pcr-001', name: 'Bio-Rad Thermal Cycler PCR Machine', category: 'Capacity', description: '96-well fast thermal cycler for DNA amplification with gradient optimization', quantity: 3, condition: 'Excellent', location: 'Molecular Biology G3', building: 'Block G', departmentId: 'dept-bio', status: 'AVAILABLE', estimatedValue: 280000, tags: 'pcr,dna,biotech,molecular,thermal cycler', specifications: JSON.stringify({ blockFormat: '96-well 0.2mL', rampRate: '4.0°C/sec', gradientRange: '30-100°C' }) },
  { id: 'res-spectro-001', name: 'Thermo Scientific NanoDrop Microvolume Spectrophotometer', category: 'Electronics', description: 'UV-Vis spectrophotometer requiring only 1µL sample for rapid nucleic acid and protein quantification', quantity: 2, condition: 'Excellent', location: 'Biotech Lab G1', building: 'Block G', departmentId: 'dept-bio', status: 'AVAILABLE', estimatedValue: 420000, tags: 'spectrophotometer,nanodrop,biotech,dna,uv-vis', specifications: JSON.stringify({ sampleVolume: '1.0-2.0µL', wavelengthRange: '190-840nm', detectionLimit: '2.0ng/µL dsDNA' }) },
  { id: 'res-sequencer-001', name: 'Illumina MiniSeq DNA Next-Gen Sequencer', category: 'Capacity', description: 'Benchtop NGS sequencer for targeted gene panels, microbiology sequencing, and small RNA assays', quantity: 1, condition: 'Excellent', location: 'Genomics Suite G4', building: 'Block G', departmentId: 'dept-bio', status: 'AVAILABLE', estimatedValue: 1800000, tags: 'sequencer,dna,genomics,illumina,ngs,biotech', specifications: JSON.stringify({ readLength: '2x150bp', maxOutput: '7.5Gb', runTime: '7-24 hours' }) },

  // Media & XR Innovation Center — Broadcast, Sound & VR
  { id: 'res-vr-001', name: 'Meta Quest 3 Mixed Reality Headset (512GB)', category: 'Electronics', description: 'Full-color passthrough spatial computing headsets for interactive 3D simulations and medical training', quantity: 15, condition: 'Excellent', location: 'XR Studio F2', building: 'Block F', departmentId: 'dept-media', status: 'AVAILABLE', estimatedValue: 56000, tags: 'vr,virtual reality,xr,meta quest,spatial', specifications: JSON.stringify({ display: '4K+ Infinite Display', chip: 'Snapdragon XR2 Gen 2', storage: '512GB' }) },
  { id: 'res-vision-001', name: 'Apple Vision Pro Spatial Computer (512GB)', category: 'Electronics', description: 'Ultra-high-resolution dual 4K micro-OLED spatial developer kit with eye and hand tracking', quantity: 2, condition: 'Excellent', location: 'Spatial Dev Lab F4', building: 'Block F', departmentId: 'dept-media', status: 'AVAILABLE', estimatedValue: 340000, tags: 'vision pro,apple,spatial,xr,visionos', specifications: JSON.stringify({ display: '23 Million Pixels Micro-OLED', chip: 'M2 + R1 Dual Processors', audio: 'Spatial Audio' }) },
  { id: 'res-podcast-001', name: 'RodeCaster Pro II Multi-Track Production Console', category: 'Electronics', description: 'Complete 4-person studio broadcast podcast rig with Shure SM7B microphones and cloudlifters', quantity: 4, condition: 'Excellent', location: 'Audio Studio F1', building: 'Block F', departmentId: 'dept-media', status: 'AVAILABLE', estimatedValue: 125000, tags: 'podcast,audio,broadcast,recording,rode,sm7b', specifications: JSON.stringify({ inputs: '4x Combo XLR/TRS', preamps: 'Revolution Preamps (76dB gain)', effects: 'APHEX DSP' }) },
  { id: 'res-lighting-001', name: 'Aputure 300d II Studio Light Panels', category: 'Electronics', description: '300W daylight balanced continuous studio light kits with lantern softboxes and C-stands', quantity: 8, condition: 'Good', location: 'Video Stage F3', building: 'Block F', departmentId: 'dept-media', status: 'AVAILABLE', estimatedValue: 38000, tags: 'lighting,video,studio,aputure,cinematography', specifications: JSON.stringify({ output: '80,000 lux @ 1m', colorTemp: '5500K', cri: '96+', wireless: 'Sidus Link' }) },
  { id: 'res-dji-mic-001', name: 'DJI Mic 2 Wireless Lavalier Microphone Kit', category: 'Electronics', description: 'Dual-channel 32-bit float wireless lav mic kit for interviews, reels, and field recording up to 250m', quantity: 12, condition: 'Excellent', location: 'Media Equipment F2', building: 'Block F', departmentId: 'dept-media', status: 'AVAILABLE', estimatedValue: 26000, tags: 'microphone,mic,audio,lavalier,wireless,dji,recording,vlog', specifications: JSON.stringify({ channels: 2, recordingFormat: '32-bit Float', range: '250m' }) },
  { id: 'res-hdmi-switcher-001', name: 'Decimator 12x12 HDMI/SDI Matrix Switcher', category: 'Electronics', description: 'Professional broadcast matrix for multi-camera live event switching and streaming', quantity: 4, condition: 'Good', location: 'Live Production Room F5', building: 'Block F', departmentId: 'dept-media', status: 'AVAILABLE', estimatedValue: 85000, tags: 'video,switcher,broadcast,hdmi,sdi,live,streaming', specifications: JSON.stringify({ inputs: '12x HDMI/SDI', outputs: '12x HDMI/SDI', latency: 'Zero-Frame' }) },

  // Additional Electronics — Computer Engineering
  { id: 'res-lap-005', name: 'Lenovo IdeaPad Slim 5 (i5/16GB)', category: 'Electronics', description: 'Lightweight 15.6" FHD IPS laptop for Python, web dev, and data analysis tasks', quantity: 35, condition: 'Good', location: 'Lab 6, Room 206', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 38000, tags: 'laptop,computer,programming,workshop,lenovo', specifications: JSON.stringify({ processor: 'Intel Core i5 13th Gen', ram: '16GB DDR5', storage: '512GB SSD' }) },
  { id: 'res-tablet-001', name: 'iPad Pro 12.9" M2 with Pencil + Magic Keyboard', category: 'Electronics', description: 'Apple iPad Pro bundle with Apple Pencil 2 and Magic Keyboard for sketching, prototyping, and note-taking', quantity: 22, condition: 'Excellent', location: 'Innovation Lab 105', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 95000, tags: 'tablet,ipad,apple,stylus,design,sketch', specifications: JSON.stringify({ chip: 'Apple M2', display: '12.9 Liquid Retina XDR', storage: '256GB' }) },
  { id: 'res-webcam-001', name: 'Logitech Brio 4K Ultra HD Pro Webcam', category: 'Electronics', description: 'Premium USB-C 4K webcam with HDR, AI autofocus, and dual noise-canceling mics — ideal for remote events', quantity: 30, condition: 'Good', location: 'Equipment Store A2', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 12000, tags: 'webcam,camera,video,conferencing,logitech,hdr', specifications: JSON.stringify({ resolution: '4K 30fps / 1080p 60fps', fieldOfView: '90°', autofocus: 'AI-powered RightSight 2' }) },

  // Additional Electronics — Electronics Lab
  { id: 'res-mic-002', name: 'Shure BLX24/PG58 UHF Wireless Handheld Mic', category: 'Electronics', description: 'Single-channel UHF wireless handheld mic for presentations, panel discussions, and campus events', quantity: 16, condition: 'Good', location: 'AV Store B1', building: 'Block B', departmentId: 'dept-ec', status: 'AVAILABLE', estimatedValue: 14000, tags: 'microphone,mic,shure,wireless,uhf,presentation,audio', specifications: JSON.stringify({ frequency: 'H10 Band 542-572MHz', range: '90m', battery: '8 hours AA' }) },
  { id: 'res-pa-001', name: 'Bose L1 Pro32 Portable Line-Array PA System', category: 'Electronics', description: 'Full 1000W portable column PA system with sub bass module for outdoor events and auditorium overflow', quantity: 3, condition: 'Good', location: 'Event Storage B6', building: 'Block B', departmentId: 'dept-ec', status: 'AVAILABLE', estimatedValue: 165000, tags: 'speaker,pa system,audio,event,outdoor,bose,sound', specifications: JSON.stringify({ power: '1000W peak', coverage: '180° uniform', connectivity: 'Bluetooth + ToneMatch' }) },
  { id: 'res-laptop-cart-001', name: 'Dell 30-Bay Secure Laptop Charging Cart', category: 'Electronics', description: 'Mobile charging station for 30 laptops with individual AC sockets, security locks, and cable management', quantity: 4, condition: 'Good', location: 'AV Room 110', building: 'Block B', departmentId: 'dept-ec', status: 'AVAILABLE', estimatedValue: 32000, tags: 'laptop,charging,cart,storage,mobile', specifications: JSON.stringify({ capacity: 30, outlets: 30, security: 'Individual Keyed Locks' }) },

  // Additional Furniture — Design Studio
  { id: 'res-chair-003', name: 'Executive High-Back Leather Office Chair', category: 'Furniture', description: 'Premium genuine leather executive chairs with lumbar support, adjustable armrests, and reclining mechanism', quantity: 40, condition: 'Good', location: 'Storage Room C4', building: 'Block C', departmentId: 'dept-ds', status: 'AVAILABLE', estimatedValue: 9500, tags: 'chair,furniture,executive,office,seating,leather', specifications: JSON.stringify({ type: 'High-Back Executive', material: 'Genuine Leather', tiltLock: true }) },
  { id: 'res-standup-desk-001', name: 'Motorized Sit-Stand Adjustable Desks', category: 'Furniture', description: 'Electric height-adjustable dual-motor standing desks with memory presets and cable management', quantity: 20, condition: 'Excellent', location: 'Innovation Studio C5', building: 'Block C', departmentId: 'dept-ds', status: 'AVAILABLE', estimatedValue: 25000, tags: 'desk,table,standing,ergonomic,office,motorized', specifications: JSON.stringify({ heightRange: '62-125cm', liftCapacity: '120kg', motor: 'Dual 300N' }) },
  { id: 'res-display-stand-001', name: 'Premium Exhibition Display Stand Sets', category: 'Furniture', description: 'Aluminum double-sided exhibition popup displays with LED spotlight kits for conferences and exhibitions', quantity: 15, condition: 'Good', location: 'Event Store C6', building: 'Block C', departmentId: 'dept-ds', status: 'AVAILABLE', estimatedValue: 8500, tags: 'display,stand,exhibition,banner,event,popup', specifications: JSON.stringify({ size: '3m x 2.3m unfolded', material: 'Anodized Aluminum', lightingIncluded: true }) },

  // Additional Robotics Resources
  { id: 'res-iot-kit-001', name: 'ESP32 IoT Maker Kit with Sensor Array', category: 'Electronics', description: 'Full IoT development kit with ESP32 WROOM board, 30+ sensors, breadboards, and IoT dashboard access', quantity: 50, condition: 'Excellent', location: 'Workshop D2', building: 'Block D', departmentId: 'dept-rb', status: 'AVAILABLE', estimatedValue: 2800, tags: 'iot,esp32,maker,electronics,wifi,bluetooth,sensors', specifications: JSON.stringify({ board: 'ESP32 WROOM 32D', wireless: 'WiFi 802.11b/g/n + BLE 4.2', sensors: 32 }) },
  { id: 'res-oscilloscope-002', name: 'Rigol DS1054Z 4-Channel Digital Oscilloscope', category: 'Electronics', description: 'Budget-friendly 50MHz 4-channel scope with 12M memory depth for student electronics labs', quantity: 14, condition: 'Good', location: 'Electronics Bench D4', building: 'Block D', departmentId: 'dept-rb', status: 'AVAILABLE', estimatedValue: 22000, tags: 'oscilloscope,rigol,electronics,measurement,lab,hardware', specifications: JSON.stringify({ bandwidth: '50MHz upgradeable to 100MHz', channels: 4, memory: '12M points' }) },

  // Additional Biotech Resources
  { id: 'res-fridge-001', name: '-80°C ULT Freezer (Thermo Scientific)', category: 'Capacity', description: 'Ultra-low temperature biomedical freezer with cascade compressors for virus samples and enzymes', quantity: 2, condition: 'Excellent', location: 'Cold Storage G5', building: 'Block G', departmentId: 'dept-bio', status: 'AVAILABLE', estimatedValue: 680000, tags: 'freezer,cold storage,biotech,ultra low temperature,medical', specifications: JSON.stringify({ temperature: '-86°C', capacity: '678L', alarmSystem: 'Audible + Remote SMS' }) },
  { id: 'res-safety-cabinet-001', name: 'Esco Class II Biological Safety Cabinet', category: 'Capacity', description: 'Type A2 BSC for sterile cell culture manipulation and pathogen containment to BSL-2 level', quantity: 3, condition: 'Excellent', location: 'Biotech Lab G2', building: 'Block G', departmentId: 'dept-bio', status: 'AVAILABLE', estimatedValue: 195000, tags: 'biosafety,cabinet,laminar flow,biotech,cleanroom,sterile', specifications: JSON.stringify({ type: 'Class II Type A2', internalWidth: '1.2m', filterEfficiency: 'H14 HEPA 99.995%' }) },

  // Additional Media & XR
  { id: 'res-gimbal-001', name: 'DJI RS 4 Pro Gimbal Stabilizer Kit', category: 'Electronics', description: 'Professional 3-axis motorized gimbal with focus motor for cinema-grade stabilized footage', quantity: 8, condition: 'Excellent', location: 'Video Equipment F3', building: 'Block F', departmentId: 'dept-media', status: 'AVAILABLE', estimatedValue: 48000, tags: 'gimbal,video,stabilizer,dji,cinema,camera', specifications: JSON.stringify({ payload: '4.5kg', stabilization: '3-axis', batteryLife: '13 hours' }) },
  { id: 'res-led-wall-001', name: 'Fine-Pitch LED Video Wall Panels (P2.5)', category: 'Electronics', description: 'High-brightness modular 2.5mm fine pitch indoor LED video wall panels for conferences and virtual production', quantity: 20, condition: 'Good', location: 'Events Hall F6', building: 'Block F', departmentId: 'dept-media', status: 'AVAILABLE', estimatedValue: 45000, tags: 'led,video wall,display,event,conference,broadcast,screen', specifications: JSON.stringify({ pixelPitch: '2.5mm', brightness: '800 nits', cabinetSize: '500x500mm' }) },
  { id: 'res-vr-002', name: 'HTC VIVE Pro 2 Tethered VR Headset Kit', category: 'Electronics', description: 'PC-tethered premium VR headsets with SteamVR tracking, ideal for architectural walkthroughs and medical simulations', quantity: 10, condition: 'Good', location: 'XR Studio F2', building: 'Block F', departmentId: 'dept-media', status: 'AVAILABLE', estimatedValue: 72000, tags: 'vr,virtual reality,htc,vive,xr,headset,spatial,simulation', specifications: JSON.stringify({ resolution: '4896x2448px', refreshRate: '120Hz', tracking: 'SteamVR 2.0' }) },

  // Additional Central Library
  { id: 'res-projector-lib-001', name: 'Epson EH-TW5820 Full HD Home/Event Projector', category: 'Electronics', description: '2700 lumens FHD projector with built-in Android TV for seminar rooms and training halls', quantity: 12, condition: 'Good', location: 'AV Cupboard E3', building: 'Block E', departmentId: 'dept-lib', status: 'AVAILABLE', estimatedValue: 28000, tags: 'projector,display,classroom,event,epson,fullhd', specifications: JSON.stringify({ resolution: '1920x1080', lumens: 2700, connectivity: 'HDMI,VGA,WiFi,Bluetooth' }) },
  { id: 'res-reading-chairs-001', name: 'Comfort Library Reading & Study Chairs', category: 'Furniture', description: 'Ergonomic cushioned seating units with integrated side table, ideal for reading rooms and informal study areas', quantity: 120, condition: 'Good', location: 'Level 2, Block E', building: 'Block E', departmentId: 'dept-lib', status: 'AVAILABLE', estimatedValue: 3500, tags: 'chair,seating,library,study,reading,furniture', specifications: JSON.stringify({ type: 'Cushioned Lounge', sideTable: true, stackable: false }) },
  { id: 'res-conf-table-001', name: 'Oval 10-Seat Boardroom Conference Table', category: 'Furniture', description: 'Premium 4.5m oval conference table with integrated cable management, power modules, and cable raceways', quantity: 8, condition: 'Excellent', location: 'Conference Room E2', building: 'Block E', departmentId: 'dept-lib', status: 'AVAILABLE', estimatedValue: 55000, tags: 'table,conference,boardroom,meeting,furniture', specifications: JSON.stringify({ size: '4.5m x 1.5m', capacity: 10, powerModules: 4, cableRaceway: true }) },

  // Spaces & Large Facilities
  { id: 'res-room-001', name: 'Smart Classroom 101 (40 Seats)', category: 'Space', description: 'Air-conditioned smart classroom with dual 85" 4K interactive displays, ceiling mic array, and lecture capture', quantity: 1, condition: 'Excellent', location: 'Block A, Ground Floor', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 10000, tags: 'classroom,room,teaching,workshop,smart', specifications: JSON.stringify({ capacity: 40, ac: true, dualDisplays: '85 inch 4K', micArray: 'Sennheiser TeamConnect' }) },
  { id: 'res-room-002', name: 'Grand University Auditorium (180 Seats)', category: 'Space', description: 'Tiered auditorium with motorized stage lighting, dual 4K projection, line-array audio, and live streaming', quantity: 1, condition: 'Excellent', location: 'Block B, Ground Floor', building: 'Block B', departmentId: 'dept-ec', status: 'AVAILABLE', estimatedValue: 35000, tags: 'hall,seminar,auditorium,conference,event,large', specifications: JSON.stringify({ capacity: 180, acoustics: 'Treated Line Array', projection: 'Dual 4K Laser', streaming: 'OBS Studio Integration' }) },
  { id: 'res-room-003', name: 'Design Innovation Open Studio (70 Seats)', category: 'Space', description: 'Open collaborative studio with mobile ideation islands, magnetic glass walls, and prototyping corners', quantity: 1, condition: 'Good', location: 'Block C, Floor 3', building: 'Block C', departmentId: 'dept-ds', status: 'AVAILABLE', estimatedValue: 15000, tags: 'studio,workshop,creative,design,open,collaborative', specifications: JSON.stringify({ capacity: 70, movableFurniture: true, whiteboardWalls: '30 meters' }) },
  { id: 'res-room-004', name: 'High-Density Compute Lab (40 Workstations)', category: 'Space', description: 'Air-conditioned computing lab with 40 Intel i7 workstations and high-speed gigabit fiber backbone', quantity: 1, condition: 'Excellent', location: 'Block A, Floor 2', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 25000, tags: 'lab,computer,programming,workshop,lan', specifications: JSON.stringify({ capacity: 40, workstations: 40, internet: '10Gbps Dedicated', software: 'Full Engineering Suite' }) },
  { id: 'res-room-005', name: 'Robotics Prototyping Hall (100 Seats)', category: 'Space', description: 'Heavy industrial workshop with anti-static flooring, 24 heavy workbenches, compressed air, and fume hoods', quantity: 1, condition: 'Good', location: 'Block D, Ground Floor', building: 'Block D', departmentId: 'dept-rb', status: 'AVAILABLE', estimatedValue: 20000, tags: 'workshop,robotics,lab,large,hardware,prototyping', specifications: JSON.stringify({ capacity: 100, workbenches: 24, powerOutlets: 80, airLines: '6 bar pneumatic' }) },
  { id: 'res-room-006', name: 'Acoustic Soundstage & Green Screen (35 Seats)', category: 'Space', description: 'Soundproof production studio with 20ft infinity green screen cyclorama and motorized DMX lighting grid', quantity: 1, condition: 'Excellent', location: 'Block F, Floor 1', building: 'Block F', departmentId: 'dept-media', status: 'AVAILABLE', estimatedValue: 22000, tags: 'studio,media,green screen,recording,soundstage', specifications: JSON.stringify({ capacity: 35, nrcRating: '0.85 soundproof', cycWall: '20x15ft Curved', dmxGrid: true }) },
  { id: 'res-room-007', name: 'Biotech Cleanroom Cell Culture Facility', category: 'Space', description: 'ISO Class 7 cleanroom facility with dual laminar flow biosafety cabinets and CO2 incubators', quantity: 1, condition: 'Excellent', location: 'Block G, Floor 1', building: 'Block G', departmentId: 'dept-bio', status: 'AVAILABLE', estimatedValue: 45000, tags: 'cleanroom,biotech,cell culture,iso class 7,biosafety', specifications: JSON.stringify({ isoClass: 'ISO 7 (Class 10,000)', hepaFiltration: '99.99%', bslLevel: 'BSL-2' }) },
  { id: 'res-room-008', name: 'Heavy CNC & Metal Fabrication Bay (50 Seats)', category: 'Space', description: 'Industrial high-bay facility with 5-ton overhead crane, 3-phase 415V power, and centralized coolant recycling', quantity: 1, condition: 'Excellent', location: 'Block H, Ground Floor', building: 'Block H', departmentId: 'dept-me', status: 'AVAILABLE', estimatedValue: 30000, tags: 'workshop,cnc,fabrication,heavy,metal,crane', specifications: JSON.stringify({ capacity: 50, overheadCrane: '5 Ton Gantry', powerGrid: '3-Phase 415V 100kVA', coolantSystem: 'Central Eco-Recycle' }) },
  { id: 'res-room-009', name: 'Central Library Seminar Suite (50 Seats)', category: 'Space', description: 'Academic seminar room with wall-to-wall whiteboards, HD projection, and breakout seating areas', quantity: 3, condition: 'Good', location: 'Block E, Level 3', building: 'Block E', departmentId: 'dept-lib', status: 'AVAILABLE', estimatedValue: 12000, tags: 'seminar,room,classroom,library,presentation,workshop', specifications: JSON.stringify({ capacity: 50, whiteboards: '3x 4m walls', projectors: 2 }) },
  { id: 'res-room-010', name: 'Executive Boardroom Suite (20 Seats)', category: 'Space', description: 'Premium 20-seat executive meeting room with Cisco Webex video conferencing, 98" display, and espresso station', quantity: 2, condition: 'Excellent', location: 'Block A, Floor 3', building: 'Block A', departmentId: 'dept-ce', status: 'AVAILABLE', estimatedValue: 30000, tags: 'boardroom,meeting,conference,executive,room', specifications: JSON.stringify({ capacity: 20, display: '98 inch 4K', videoConference: 'Cisco Webex', ac: true }) },
];

async function createHistoricalData(prisma: PrismaClient) {
  const req1 = await prisma.requirement.create({
    data: {
      id: 'req-hist-001',
      userId: 'user-req',
      title: 'Python & AI Bootcamp — 25 participants',
      description: 'Need laptops, compute workstation and projector for a 3-day Python/AI bootcamp',
      rawInput: 'I need 20 laptops, a projector and an AI workstation for a 3-day bootcamp with 25 participants',
      structuredData: JSON.stringify({ laptops: 20, projector: 1, workstation: 1, duration: '3 days' }),
      neededFrom: new Date('2026-07-10T09:00:00'),
      neededUntil: new Date('2026-07-12T17:00:00'),
      status: 'FULFILLED',
      estimatedCost: 1420000,
      createdAt: new Date('2026-07-08'),
    },
  });

  const match1 = await prisma.match.create({
    data: {
      id: 'match-hist-001',
      requirementId: req1.id,
      resourceId: 'res-lap-001',
      matchScore: 98,
      quantityMatched: 20,
      reason: 'Dell Inspiron laptops from Computer Engineering Lab 3 matched 100% of programming specifications.',
      status: 'APPROVED',
      createdAt: new Date('2026-07-08'),
    },
  });

  await prisma.impact.create({
    data: {
      matchId: match1.id,
      estimatedSavings: 1100000,
      estimatedWasteAvoided: 140,
      estimatedCO2Avoided: 5500,
    },
  });

  const req2 = await prisma.requirement.create({
    data: {
      id: 'req-hist-002',
      userId: 'user-req',
      title: 'Autonomous Robotics Challenge — 40 participants',
      description: 'Arduino kits, Raspberry Pi units and workshop hall for robotics competition',
      rawInput: 'We need 25 Arduino kits, 15 Raspberry Pi kits, and the robotics workshop hall for 40 students',
      structuredData: JSON.stringify({ arduinoKits: 25, raspberryPi: 15, room: 1, participants: 40 }),
      neededFrom: new Date('2026-07-20T10:00:00'),
      neededUntil: new Date('2026-07-21T18:00:00'),
      status: 'FULFILLED',
      estimatedCost: 320000,
      createdAt: new Date('2026-07-15'),
    },
  });

  const match2 = await prisma.match.create({
    data: {
      id: 'match-hist-002',
      requirementId: req2.id,
      resourceId: 'res-arduino-001',
      matchScore: 99,
      quantityMatched: 25,
      reason: 'Arduino Mega & Sensor Master Kits from Robotics Lab provided complete component coverage.',
      status: 'APPROVED',
      createdAt: new Date('2026-07-15'),
    },
  });

  await prisma.impact.create({
    data: {
      matchId: match2.id,
      estimatedSavings: 240000,
      estimatedWasteAvoided: 48,
      estimatedCO2Avoided: 1200,
    },
  });

  const req3 = await prisma.requirement.create({
    data: {
      id: 'req-hist-003',
      userId: 'user-req',
      title: 'Annual INSPIRE Design Symposium — 120 participants',
      description: 'Auditorium, 100 folding chairs, conference tables, 4K projectors and wireless microphones',
      rawInput: 'Symposium needs 100 chairs, 2 4K projectors, 4 wireless microphones, conference tables and the main auditorium',
      structuredData: JSON.stringify({ chairs: 100, projectors: 2, microphones: 4, tables: 12, room: 1 }),
      neededFrom: new Date('2026-08-01T09:00:00'),
      neededUntil: new Date('2026-08-01T18:00:00'),
      status: 'FULFILLED',
      estimatedCost: 480000,
      createdAt: new Date('2026-07-25'),
    },
  });

  const match3 = await prisma.match.create({
    data: {
      id: 'match-hist-003',
      requirementId: req3.id,
      resourceId: 'res-chair-002',
      matchScore: 96,
      quantityMatched: 100,
      reason: 'Padded folding chairs from Design Studio fulfilled attendee seating without rental costs.',
      status: 'APPROVED',
      createdAt: new Date('2026-07-25'),
    },
  });

  await prisma.impact.create({
    data: {
      matchId: match3.id,
      estimatedSavings: 360000,
      estimatedWasteAvoided: 220,
      estimatedCO2Avoided: 1800,
    },
  });

  const req4 = await prisma.requirement.create({
    data: {
      id: 'req-hist-004',
      userId: 'user-req',
      title: 'XR & Spatial Computing Workshop — 20 participants',
      description: 'Meta Quest 3 VR headsets and Black Box Studio for interactive spatial computing class',
      rawInput: 'Need 8 VR headsets, studio lighting and a soundproof room for VR development session',
      structuredData: JSON.stringify({ vrHeadsets: 8, studio: 1, lights: 4 }),
      neededFrom: new Date('2026-08-05T13:00:00'),
      neededUntil: new Date('2026-08-05T17:00:00'),
      status: 'FULFILLED',
      estimatedCost: 450000,
      createdAt: new Date('2026-08-02'),
    },
  });

  const match4 = await prisma.match.create({
    data: {
      id: 'match-hist-004',
      requirementId: req4.id,
      resourceId: 'res-vr-001',
      matchScore: 97,
      quantityMatched: 8,
      reason: 'Media Center Meta Quest 3 headsets matched high-resolution XR development requirements.',
      status: 'APPROVED',
      createdAt: new Date('2026-08-02'),
    },
  });

  await prisma.impact.create({
    data: {
      matchId: match4.id,
      estimatedSavings: 384000,
      estimatedWasteAvoided: 35,
      estimatedCO2Avoided: 1920,
    },
  });

  const req5 = await prisma.requirement.create({
    data: {
      id: 'req-hist-005',
      userId: 'user-req',
      title: 'Molecular Genetics Workshop — 16 researchers',
      description: 'Centrifuges and Spectrophotometer for DNA isolation hands-on practical session',
      rawInput: 'Need 2 refrigerated microcentrifuges and 1 NanoDrop spectrophotometer for genomics lab',
      structuredData: JSON.stringify({ centrifuge: 2, spectrophotometer: 1, duration: '2 days' }),
      neededFrom: new Date('2026-08-10T10:00:00'),
      neededUntil: new Date('2026-08-11T16:00:00'),
      status: 'FULFILLED',
      estimatedCost: 810000,
      createdAt: new Date('2026-08-07'),
    },
  });

  const match5 = await prisma.match.create({
    data: {
      id: 'match-hist-005',
      requirementId: req5.id,
      resourceId: 'res-spectro-001',
      matchScore: 99,
      quantityMatched: 1,
      reason: 'Thermo NanoDrop spectrophotometer from Biotech Lab provided microvolume UV-Vis analytical capabilities.',
      status: 'APPROVED',
      createdAt: new Date('2026-08-07'),
    },
  });

  await prisma.impact.create({
    data: {
      matchId: match5.id,
      estimatedSavings: 420000,
      estimatedWasteAvoided: 18,
      estimatedCO2Avoided: 2100,
    },
  });

  // Historical Match 6: Mechanical CNC & Waterjet fabrication for Formula Student racing team
  const req6 = await prisma.requirement.create({
    data: {
      id: 'req-hist-006',
      userId: 'user-req',
      title: 'Formula Student Racecar Chassis Machining',
      description: '3-axis CNC milling and Waterjet time for aluminum uprights and titanium suspension arms',
      rawInput: 'Need 20 hours Haas CNC mill time and waterjet cutter for precision racecar parts',
      structuredData: JSON.stringify({ cncTime: 20, waterjet: 10, material: '7075-T6 Aluminum' }),
      neededFrom: new Date('2026-08-12T09:00:00'),
      neededUntil: new Date('2026-08-14T18:00:00'),
      status: 'FULFILLED',
      estimatedCost: 650000,
      createdAt: new Date('2026-08-09'),
    },
  });

  const match6 = await prisma.match.create({
    data: {
      id: 'match-hist-006',
      requirementId: req6.id,
      resourceId: 'res-cnc-001',
      matchScore: 99,
      quantityMatched: 1,
      reason: 'Haas Mini Mill from Mechanical Heavy Workshop provided aerospace-grade machining tolerance without third-party vendor machining costs.',
      status: 'APPROVED',
      createdAt: new Date('2026-08-09'),
    },
  });

  await prisma.impact.create({
    data: {
      matchId: match6.id,
      estimatedSavings: 580000,
      estimatedWasteAvoided: 95,
      estimatedCO2Avoided: 3200,
    },
  });
}

async function main() {
  console.log('🌱 Seeding enriched INSPIRE University database with 48+ realistic assets across 8 departments...');

  await prisma.impact.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.match.deleteMany();
  await prisma.requirement.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  for (const dept of departments) {
    await prisma.department.create({ data: dept });
  }
  console.log(`✅ Created ${departments.length} departments`);

  for (const user of users) {
    await prisma.user.create({ data: user });
  }
  console.log(`✅ Created ${users.length} users`);

  for (const resource of resources) {
    await prisma.resource.create({
      data: {
        ...resource,
        availableFrom: now,
        availableUntil: future,
        lastVerified: now,
      },
    });
  }
  console.log(`✅ Created ${resources.length} resources`);

  await createHistoricalData(prisma);
  console.log('✅ Created historical requirements, matches, and impact metrics');

  console.log('\n🎉 INSPIRE University database seeded successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
