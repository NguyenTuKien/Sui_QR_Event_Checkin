import { bcs } from '@mysten/sui/bcs';
import { normalizeSuiAddress, normalizeSuiObjectId } from '@mysten/sui/utils';

// Mirrors Move structs:
// struct ID has copy, drop, store { bytes: address }
// struct CheckInMsg has copy, drop, store { event_id: ID, user: address }
const ID = bcs.struct('ID', {
  bytes: bcs.Address,
});

const CheckInMsg = bcs.struct('CheckInMsg', {
  event_id: ID,
  user: bcs.Address,
});

export function serializeCheckInMsg(params: { eventId: string; userAddress: string }): Uint8Array {
  const eventId = normalizeSuiObjectId(params.eventId);
  const user = normalizeSuiAddress(params.userAddress);

  return CheckInMsg.serialize({
    event_id: { bytes: eventId },
    user,
  }).toBytes();
}
