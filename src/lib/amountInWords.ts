export function amountInWords(value: number): string {
  const ones = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const words = (n: number): string => n < 20 ? ones[n]! : n < 100 ? tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "")
    : n < 1000 ? ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + words(n % 100) : "")
    : n < 100000 ? words(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + words(n % 1000) : "")
    : n < 10000000 ? words(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + words(n % 100000) : "")
    : words(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + words(n % 10000000) : "");
  const paise = Math.round(Math.abs(value) * 100);
  return `Rupees ${words(Math.floor(paise / 100))}${paise % 100 ? " and " + words(paise % 100) + " Paise" : ""} Only`;
}
