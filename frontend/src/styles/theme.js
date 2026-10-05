// สีประจำมหาวิทยาลัยเทคโนโลยีราชมงคลรัตนโกสินทร์ = สีแดงเลือดนก
// เก็บ token ไว้ที่เดียว ใครจะปรับโทนก็แก้ตรงนี้พอ
export const brand = {
  oxblood: '#A31621',
  deep: '#7C0D18',
  bright: '#C8324A',
  gold: '#C9A227', // ทองราชมงคล ใช้เป็น accent เล็ก ๆ
}

export const light = {
  bg: '#F6F4F2', surface: '#FFFFFF', surface2: '#FBF9F8', line: '#E7E1DC',
  ink: '#1C1917', muted: '#6E6560', railText: '#F3E7E4', railMuted: '#E0B4B0',
  brand: brand.oxblood,
  shadow: '0 1px 2px rgba(28,25,23,.06), 0 8px 24px rgba(124,13,24,.06)',
}

export const dark = {
  bg: '#16110F', surface: '#1F1815', surface2: '#241C19', line: '#352A25',
  ink: '#F4EFEC', muted: '#A79C95', railText: '#F5E9E7', railMuted: '#D19A97',
  brand: brand.bright,
  shadow: '0 1px 2px rgba(0,0,0,.4)',
}
