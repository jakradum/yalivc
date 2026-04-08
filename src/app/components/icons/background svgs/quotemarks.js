export default function QuoteMarks({ className, fill = '#ebde84', stroke, strokeWidth = 1.44 }) {
  return (
    <svg
      className={className}
      width="161"
      height="120"
      viewBox="0 0 161 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M160.5 0.5H86.5V75.5H126L99 119H134L160.5 75.5V0.5Z" fill={stroke ? 'none' : fill} stroke={stroke} strokeWidth={stroke ? strokeWidth : undefined} />
      <path d="M74.5 0.5H0.5V75.5H40L13 119H48L74.5 75.5V0.5Z" fill={stroke ? 'none' : fill} stroke={stroke} strokeWidth={stroke ? strokeWidth : undefined} />
    </svg>
  );
}
