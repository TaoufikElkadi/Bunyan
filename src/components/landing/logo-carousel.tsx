/**
 * Mosque name carousel — runway.com style "Trusted by fast moving companies"
 * Since we don't have real logos yet, we show mosque names in a styled strip.
 */
const mosques = [
  "Moskee An-Nour",
  "Al-Fatiha Amsterdam",
  "Ayasofya Rotterdam",
  "Essalam Den Haag",
  "Al-Ihsan Utrecht",
  "Sultan Ahmet Eindhoven",
  "Al-Waqf Breda",
  "Tawheed Tilburg",
  "Mevlana Arnhem",
  "Fatih Deventer",
]

export function LogoCarousel() {
  return (
    <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
      {mosques.map((name) => (
        <div
          key={name}
          className="text-[14px] font-[492] tracking-[-0.14px] text-[color:rgba(38,27,7,0.36)] select-none"
        >
          {name}
        </div>
      ))}
    </div>
  )
}
