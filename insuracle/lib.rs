#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod insuracle {
    use ink::storage::Mapping;
    use ink::prelude::vec::Vec;
    use parity_scale_codec::{Encode, Decode};
    #[cfg(feature = "std")]
    use scale_info::TypeInfo;

    /// Represents an insurance policy.
    #[derive(Encode, Decode, Clone, Debug, PartialEq, Eq)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    #[cfg_attr(feature = "std", derive(ink::storage::traits::StorageLayout))]
    pub struct Policy {
        pub holder: AccountId,
        pub premium: Balance,
        pub payout: Balance,
        pub active: bool,
    }

    /// Defines the storage of the contract.
    #[ink(storage)]
    pub struct Insuracle {
        pub policies: Mapping<AccountId, Policy>,
        pub flood_level: u32,
        pub payout_threshold: u32,
        pub owner: AccountId,
    }

    impl Insuracle {
        /// Constructor that initializes the contract with a payout threshold.
        #[ink(constructor)]
        pub fn new(payout_threshold: u32) -> Self {
            let caller = Self::env().caller();
            Self {
                policies: Mapping::default(),
                flood_level: 0,
                payout_threshold,
                owner: caller,
            }
        }

        /// Allows a user to buy a policy by paying a premium.
        #[ink(message, payable)]
        pub fn buy_policy(&mut self, payout: Balance) {
            let caller = self.env().caller();
            let premium = self.env().transferred_value();
            let policy = Policy {
                holder: caller,
                premium,
                payout,
                active: true,
            };
            self.policies.insert(caller, &policy);
        }

        /// Updates the flood level (only callable by the owner).
        #[ink(message)]
        pub fn update_flood_level(&mut self, new_level: u32) {
            let caller = self.env().caller();
            assert_eq!(caller, self.owner, "Only owner can update flood level");
            self.flood_level = new_level;
        }

        /// Triggers a payout if the flood level exceeds the threshold and the policy is active.
        #[ink(message)]
        pub fn trigger_payout(&mut self) {
            let caller = self.env().caller();
            if let Some(mut policy) = self.policies.get(caller) {
                if policy.active && self.flood_level >= self.payout_threshold {
                    self.env().transfer(caller, policy.payout).ok();
                    policy.active = false;
                    self.policies.insert(caller, &policy);
                }
            }
        }

        /// Retrieves a policy for a given account.
        #[ink(message)]
        pub fn get_policy(&self, account: AccountId) -> Option<Policy> {
            self.policies.get(account)
        }

        /// Retrieves the current flood level.
        #[ink(message)]
        pub fn get_flood_level(&self) -> u32 {
            self.flood_level
        }
    }

    /// Unit tests for the contract.
    #[cfg(test)]
    mod tests {
        use super::*;

        /// Tests the default constructor.
        #[ink::test]
        fn default_works() {
            let insuracle = Insuracle::new(0);
            assert_eq!(insuracle.get_flood_level(), 0);
        }

        /// Tests basic contract functionality.
        #[ink::test]
        fn it_works() {
            let mut insuracle = Insuracle::new(100);
            assert_eq!(insuracle.get_flood_level(), 0);
            insuracle.update_flood_level(150);
            assert_eq!(insuracle.get_flood_level(), 150);
        }
    }

    /// End-to-end (E2E) tests for the contract.
    #[cfg(all(test, feature = "e2e-tests"))]
    mod e2e_tests {
        use super::*;
        use ink_e2e::ContractsBackend;

        type E2EResult<T> = std::result::Result<T, Box<dyn std::error::Error>>;

        /// Tests contract instantiation and default values.
        #[ink_e2e::test]
        async fn default_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let constructor = InsuracleRef::new(0);
            let contract = client
                .instantiate("insuracle", &ink_e2e::alice(), constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let call_builder = contract.call_builder::<Insuracle>();

            let get = call_builder.get_flood_level();
            let get_result = client.call_dry_run(&ink_e2e::alice(), &get).await?;
            assert_eq!(get_result.return_value(), 0);

            Ok(())
        }

        /// Tests reading and writing flood level.
        #[ink_e2e::test]
        async fn it_works(mut client: ink_e2e::Client<C, E>) -> E2EResult<()> {
            let constructor = InsuracleRef::new(100);
            let contract = client
                .instantiate("insuracle", &ink_e2e::bob(), constructor)
                .submit()
                .await
                .expect("instantiate failed");
            let mut call_builder = contract.call_builder::<Insuracle>();

            let get = call_builder.get_flood_level();
            let get_result = client.call_dry_run(&ink_e2e::bob(), &get).await?;
            assert_eq!(get_result.return_value(), 0);

            let update_level = call_builder.update_flood_level(200);
            client
                .call(&ink_e2e::bob(), update_level)
                .submit()
                .await
                .expect("update failed");

            let get = call_builder.get_flood_level();
            let get_result = client.call_dry_run(&ink_e2e::bob(), &get).await?;
            assert_eq!(get_result.return_value(), 200);

            Ok(())
        }
    }
}