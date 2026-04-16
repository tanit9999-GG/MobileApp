// ============================================================
// CONFIG — แก้ข้อมูลส่วนตัวได้ที่นี่
// ============================================================
const STATIONS = [
  {
    id: 'heaven',
    x: 200,
    label: 'สวรรค์',
    sprite: 'angel',
    building: 'cloud',
    dialogue: {
      name: '★ NARRATOR ★',
      text: 'กาลครั้งหนึ่ง ณ สรวงสวรรค์...\nเทวดาน้อยองค์หนึ่งกำลังจะลงมาเกิด...'
    }
  },
  {
    id: 'hospital',
    x: 1200,
    label: 'โรงพยาบาล',
    sprite: 'baby',
    building: 'hospital',
    dialogue: {
      name: '★ BORN ★',
      text: 'นายธนิต สิทธิยากร\nเกิดในเดือนมิถุนายน\nณ โรงพยาบาล...'
    }
  },
  {
    id: 'elementary',
    x: 2200,
    label: 'ประถมศึกษา',
    sprite: 'child',
    building: 'school',
    dialogue: {
      name: '★ ELEMENTARY ★',
      text: 'เข้าเรียนระดับประถมศึกษา\nที่โรงเรียน...\n(ใส่ชื่อโรงเรียนได้ที่ config.js)'
    }
  },
  {
    id: 'highschool',
    x: 3200,
    label: 'มัธยมศึกษา',
    sprite: 'teen',
    building: 'highschool',
    dialogue: {
      name: '★ HIGH SCHOOL ★',
      text: 'เข้าสู่วัยรุ่น เรียนระดับมัธยม\nที่โรงเรียน...\n(ใส่ชื่อโรงเรียนได้ที่ config.js)'
    }
  },
  {
    id: 'university',
    x: 4200,
    label: 'มหาวิทยาลัย',
    sprite: 'grad',
    building: 'university',
    dialogue: {
      name: '★ UNIVERSITY ★',
      text: 'จบการศึกษาระดับปริญญาตรี\nจากมหาวิทยาลัย...\nสาขา...\n(ใส่ชื่อมหาลัยได้ที่ config.js)'
    }
  },
  {
    id: 'job1',
    x: 5200,
    label: 'งานแรก',
    sprite: 'worker',
    building: 'office1',
    dialogue: {
      name: '★ FIRST JOB ★',
      text: 'เริ่มทำงานที่แรก\nบริษัท...\nตำแหน่ง...\n(ใส่ข้อมูลได้ที่ config.js)'
    }
  },
  {
    id: 'job2',
    x: 6200,
    label: 'งานที่สอง',
    sprite: 'worker',
    building: 'office2',
    dialogue: {
      name: '★ SECOND JOB ★',
      text: 'ย้ายมาทำงานที่\nบริษัท...\nตำแหน่ง...\n(ใส่ข้อมูลได้ที่ config.js)'
    }
  },
  {
    id: 'current',
    x: 7200,
    label: 'งานปัจจุบัน',
    sprite: 'worker',
    building: 'office3',
    dialogue: {
      name: '★ CURRENT ★',
      text: 'ปัจจุบันทำงานที่\nบริษัท...\nตำแหน่ง...\n\n★ Thank you for watching! ★'
    }
  }
];

const WORLD_WIDTH = 8000;
const VW = 480;
const VH = 270;
const GROUND_Y = 210;
const SCROLL_SPEED = 2.5;
