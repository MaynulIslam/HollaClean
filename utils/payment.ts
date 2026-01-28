
export const calculatePayment = (hourlyRate: number, hours: number) => {
  const subtotal = hourlyRate * hours;
  const platformCommission = subtotal * 0.20; // 20%
  const stripeFee = (subtotal * 0.029) + 0.30; // 2.9% + $0.30
  const cleanerPayout = subtotal - platformCommission;
  const platformProfit = platformCommission - stripeFee;
  
  return {
    subtotal: subtotal.toFixed(2),
    platformCommission: platformCommission.toFixed(2),
    stripeFee: stripeFee.toFixed(2),
    cleanerPayout: cleanerPayout.toFixed(2),
    platformProfit: platformProfit.toFixed(2)
  };
};
