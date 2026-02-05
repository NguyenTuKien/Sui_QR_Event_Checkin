module marketplace::event_manager {
    // 1. Sửa cách import: Tách module và type ra để tránh lỗi "unbound self"
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Self, Table}; // Import cả module 'table' và type 'Table'
    use sui::ed25519;
    use sui::clock::{Self, Clock};
    use sui::bcs;
    use std::vector;

    /// ========= Structs (Thêm từ khóa 'public') =========
    
    public struct Event has key {
        id: UID,
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        creator: address,
        public_key: vector<u8>,
        attendees: Table<address, bool>,
    }

    public struct AttendanceNFT has key {
        id: UID,
        event_id: ID,
        owner: address,
        timestamp: u64,
    }

    /// Sửa lỗi: Struct nội bộ cũng cần khai báo public (hoặc public(package))
    public struct CheckInMsg has copy, drop, store {
        event_id: ID,
        user: address,
    }

    /// ========= Errors =========
    const E_ALREADY_ATTENDED: u64 = 1;
    const E_INVALID_SIGNATURE: u64 = 2;
    const E_INVALID_MESSAGE: u64 = 3;
    const E_INSECURE_DISABLED: u64 = 4;

    /// ========= Functions =========

    // Sửa warning: Dùng 'public fun' thay vì 'public entry fun' nếu không cần thiết
    // Tuy nhiên giữ 'entry' để gọi dễ dàng từ Explorer cũng được.
    public entry fun create_event(
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        public_key: vector<u8>,
        ctx: &mut TxContext,
    ) {
        let creator = tx_context::sender(ctx);
        let event = Event {
            id: object::new(ctx),
            name,
            description,
            image_url,
            creator,
            public_key,
            attendees: table::new(ctx),
        };
        transfer::share_object(event);
    }

    public fun check_is_attended(event: &Event, user: address): bool {
        table::contains(&event.attendees, user)
    }

    /// Deprecated: Hàm check-in cũ.
    /// Sửa lỗi logic: Dùng dấu gạch dưới (_) để đánh dấu biến không dùng
    public entry fun check_in(_event: &mut Event, _ctx: &mut TxContext) {
        abort E_INSECURE_DISABLED
    }

    fun bytes_eq(a: &vector<u8>, b: &vector<u8>): bool {
        if (vector::length(a) != vector::length(b)) return false;
        let mut i = 0;
        let n = vector::length(a);
        while (i < n) {
            if (*vector::borrow(a, i) != *vector::borrow(b, i)) return false;
            i = i + 1;
        };
        true
    }

    /// Check-in Secure
    public entry fun check_in_secure(
        event: &mut Event,
        signature: vector<u8>,
        msg: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let user = tx_context::sender(ctx);
        assert!(!check_is_attended(event, user), E_ALREADY_ATTENDED);

        let expected = bcs::to_bytes(&CheckInMsg {
            event_id: object::uid_to_inner(&event.id),
            user,
        });
        
        // Sửa lỗi logic so sánh bytes
        assert!(bytes_eq(&msg, &expected), E_INVALID_MESSAGE);

        assert!(ed25519::ed25519_verify(&signature, &event.public_key, &msg), E_INVALID_SIGNATURE);

        table::add(&mut event.attendees, user, true);

        let nft = AttendanceNFT {
            id: object::new(ctx),
            event_id: object::uid_to_inner(&event.id),
            owner: user,
            timestamp: clock::timestamp_ms(clock),
        };
        
        transfer::transfer(nft, user);
    }
}