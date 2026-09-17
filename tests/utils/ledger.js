export function validateLedgerAggregation(entries = []) {
  let balance = 0;
  return entries.map((entry) => {
    const delta = Number(entry.quantity_change) || 0;
    balance += delta;
    return balance;
  });
}

export function simulateInventoryFlow(operations = []) {
  let stock = 0;
  const history = [];
  for (const op of operations) {
    switch (op.type) {
      case "receipt":
        stock += op.quantity;
        break;
      case "delivery":
        stock -= op.quantity;
        break;
      case "transfer_out":
        stock -= op.quantity;
        break;
      case "transfer_in":
        stock += op.quantity;
        break;
      case "adjustment":
        stock = op.newQuantity;
        break;
      default:
        throw new Error(`Unsupported op ${op.type}`);
    }
    history.push(stock);
  }
  return history;
}
