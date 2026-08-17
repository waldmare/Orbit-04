# Współpraca przy ORBIT//04

Dzięki za zainteresowanie projektem. Najbardziej przydatne są małe, dobrze opisane zmiany, które zachowują czytelność walki i nie wprowadzają niesprawdzonych assetów.

## Uruchomienie środowiska

W Windows:

```bat
npm.cmd install
npm.cmd test
npm.cmd start
```

W macOS lub Linux:

```bash
npm install
npm test
npm start
```

Instalacja uruchamia skrypt `postinstall`, który kopiuje Phaser do lokalnego katalogu `vendor/`.

## Proponowany przepływ pracy

1. Utwórz gałąź o krótkiej, opisowej nazwie.
2. Ogranicz zmianę do jednego problemu lub funkcji.
3. Uruchom pełne `npm test`.
4. Opisz wpływ na gracza oraz sposób sprawdzenia zmiany.
5. Dołącz zrzut ekranu przy zmianach interfejsu albo grafiki.

## Zasady jakości

- nie zmieniaj balansu przy poprawkach technicznych lub wizualnych;
- utrzymuj czytelne telegraphy ataków i obsługę `REDUCED MOTION`;
- nie dodawaj `node_modules/`, paczek zbudowanych ani lokalnego `vendor/phaser.min.js`;
- każdy zewnętrzny asset musi mieć jasną licencję i wpis w `THIRD_PARTY.md`;
- nie umieszczaj sekretów, tokenów, danych kont ani prywatnych ścieżek systemowych;
- nowe elementy runtime powinny mieć test regresyjny, jeśli można je sprawdzić automatycznie.

## Zgłoszenia błędów

Użyj formularza GitHub i podaj kroki odtworzenia, wersję systemu, sposób uruchomienia oraz pełny komunikat błędu. Przy problemach graficznych dołącz zrzut ekranu, a przy problemach startowych treść terminala.
