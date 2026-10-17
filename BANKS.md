# Transfer institution names

Verified on 2026-10-17 using official sources:

- Banco BHD: https://www.sb.gob.do/supervisados/entidades-de-intermediacion-financiera/banco-bhd/
- Banco BHD current corporate publication: https://bhd.com.do/homepage-personal/sala-de-prensa/df92b1f2-5958-4db3-a558-f52e4ef2e72b
- Banco Popular Dominicano: https://www.grupopopular.com/Filiales/Pages/Banco-Popular-Dominicano.aspx
- Scotiabank Republica Dominicana: https://do.scotiabank.com/acerca-de-scotiabank/quienes-somos/scotiabank-en-republica-dominicana.html
- Asociacion Duarte de Ahorros y Prestamos: https://adap.com.do/

The selector offers BHD once, with BHD Leon as a recognizable legacy alias.
Previously saved method names are not migrated or rewritten: participant RPCs
continue receiving their existing name identifiers. Duplicate detection in the
configuration UI treats both BHD spellings as the same bank. Other existing
institutions remain available, plus Otro banco with a required institution name.
Selecting an institution does not open a bank account, save payment instructions,
verify ownership or connect a bank API. Account and holder must be supplied by
the organizer; payment confirmation remains manual after external bank review.
