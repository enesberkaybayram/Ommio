
// Web'de reklam kütüphanesi olmadığı için boş bir View döndürüyoruz
export default function OmmioAdBanner({ isPremium }: { isPremium: boolean }) {
  return null; 
  // İstersen web'de reklam yerine başka bir şey göstermek için:
  // return <View style={{height: 50, backgroundColor: '#eee'}}><Text>Reklam Alanı</Text></View>;
}