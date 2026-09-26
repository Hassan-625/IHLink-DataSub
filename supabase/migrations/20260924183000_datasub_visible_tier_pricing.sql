-- Customer-visible tier prices are controlled by DataSub Operations.
-- Top Seller remains an administrator-awarded performance status even though a
-- lower comparison price can be displayed to encourage reseller progression.
update public.datasub_upgrade_offers set name='API User',base_price=20000,is_active=true,description='API access for approved websites and applications. Contact IHLink and submit your website/application details for approval.',updated_at=now() where code='api_developer';
update public.datasub_upgrade_offers set name='Top Seller',base_price=10000,is_active=true,description='Performance tier displayed to encourage reseller growth. The displayed price is controlled by IHLink; actual Top Seller status is awarded only by an administrator based on performance.',updated_at=now() where code='top_seller';
