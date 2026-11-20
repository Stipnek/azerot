# Changelog

## UI review — two playable samples only

- Reworked the map service drawer as «Город» (working label). It opens upward, directly left of «Герой», with Tavern, Merchant and Catalogue preserving the original actions. Removed the text close button only here; retained outside click, Escape and keyboard navigation. Desktop navigation is now at the bottom to match the placement requirement.
- Reworked Deadmines preparation: readable recommendations and party cards; ordered encounter cards with an optional branch; real item catalogue with eligibility labels; non-overlapping scroll area and start footer. Explicit starting, party rules, encounter mechanics, loot, save format and art are unchanged. The between-battle interface is not part of this review.
- Added a targeted Chromium review script and updated old test selectors for the new interface. See `docs/ui-review-register.md` for evidence and open acceptance items.
- No publication, GitHub writes or new runtime hosts. No personal or synthetic save backups included in the handoff.
