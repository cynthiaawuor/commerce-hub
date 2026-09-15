const currencyFormatter = new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" });

const dateFormatter = new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" });

export const formatCurrency = (amount: number) => currencyFormatter.format(amount);

export const formatDate = (isoDate: string) => dateFormatter.format(new Date(isoDate));
