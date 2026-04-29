# Betting Strategy Simulator

En lokal React + TypeScript-app byggd med Vite. Appen är ett utbildningslabb för att förstå simulering, state management, strategi-logik, eventflöden, risk, Martingale och statistik.

Appen använder bara virtuella pengar och lokal data i webbläsaren. Den kopplar inte upp sig mot Svenska Spel eller något annat casino, loggar inte in, scrapar inte externa webbsidor, använder inte OCR och klickar inte på riktiga sajter.

## Installera

```bash
npm install
```

## Kör lokalt

```bash
npm run dev
```

Öppna den lokala URL som Vite visar, normalt:

```text
http://localhost:5173
```

## Testa logiken

```bash
npm test
```

## Vad appen simulerar

Simulatorn genererar roulette-liknande färgresultat:

- `red`: 18/37
- `black`: 18/37
- `green`: 1/37

Varje spin är oberoende av tidigare spins. Historiken påverkar alltså inte sannolikheten för nästa spin; den används bara av strategin för att skapa signaler.

## Värden du kan ställa in

`Intervall (ms)` styr hur snabbt auto-spin körs. Lägsta värde är `1 ms`.

`Bot enabled` avgör om botten får placera virtuella bets när signal uppstår.

`Bet amount` är grundinsatsen i kronor. Standard är `10`.

`Betta efter antal i rad` är streak-tröskeln. Exempel: `4` betyder att strategin kan signalera efter 4 röda eller 4 svarta i rad.

`Strategy` kan vara:

- `opposite`: betta motsatt färg från streaken.
- `same`: betta samma färg som streaken.

`Insatsmodell` styr hur insatsen utvecklas i en serie:

- `martingale`: dubbla efter förlust så länge samma streak fortsätter och riskreglerna tillåter.
- `cappedMartingale`: dubbla efter förlust, men bara upp till valt antal steg.

`Max progression steps` anger totalt antal bets i en capped-serie. Med baseBet `10` och `3` steg blir serien `10 -> 20 -> 40`.

`Profit target` styr när simulatorn ska stoppa sessionen automatiskt.

## Strategiregler

Strategin analyserar aktuell streak från slutet av historiken.

`green` bryter streaken. En sekvens som `red, red, green, red, red` räknas därför som `red x 2`, inte `red x 4`.

Om tröskeln är `5` och de senaste resultaten är:

```text
black, black, black, black, black
```

skapas en signal med streak `black x 5`.

Med `opposite` föreslås då `red`. Med `same` föreslås `black`.

## Botflöde

Botten fungerar bara i simulatorn.

1. Ett nytt spin-resultat skapas.
2. Om det finns ett öppet bet från föregående spin avgörs det.
3. Om botten är aktiverad analyseras historiken.
4. Om strategin ger signal placeras ett virtuellt bet.
5. Bettet avgörs först på nästa spin, aldrig på samma spin som signalen.

Om nästa spin matchar bet-färgen blir profit `+amount`.

Om nästa spin inte matchar blir profit `-amount`.

Om nästa spin är `green` förlorar bettet alltid, eftersom bets bara kan vara på `red` eller `black`.

## Martingale

Martingale är ett extra lager ovanpå strategin.

Exempel med grundinsats `10`, tröskel `5`, strategi `opposite`:

1. Det blir `5 black` i rad.
2. Botten lägger `10 kr` på `red`.
3. Nästa spin blir också `black`.
4. Bettet förlorar och saldot minskar med `10 kr`.
5. Eftersom samma black-streak fortsätter läggs nästa bet på `red`, men beloppet dubblas till `20 kr`.

Om även nästa bet förlorar kan nästa insats bli `40 kr`, så länge saldot räcker.

När ett Martingale-bet vinner återgår nästa vanliga signal till grundinsatsen.

## Capped Martingale och Series

En `Series` börjar när botten får en signal och lägger första bettet. Serien håller reda på trigger, bet-färg, progression mode, använda insatser, total staked, net profit och status.

Med `cappedMartingale` kan serien bara använda ett bestämt antal steg.

Exempel:

```text
baseBet = 10
maxProgressionSteps = 3

Bet 1: 10 kr
Bet 2: 20 kr
Bet 3: 40 kr
```

Om alla tre förlorar blir total serieprofit `-70 kr`. Serien stängs som `lost_capped`, botten lägger inte `80 kr`, och aktuell streak kan låsas.

Om `lockAfterCappedLoss` är på väntar botten tills streaken bryts. UI:t visar då till exempel:

```text
Locked: waiting for red streak to break
```

När streaken bryts av motsatt färg eller `green` släpps låset.

## Sessions

Session profit räknas som:

```text
currentBalance - sessionStartBalance
```

Om `stopOnProfitTarget` är på stoppas sessionen när session profit är minst `profitTarget`.

## När saldo inte räcker

Botten får inte placera ett bet om saldot är lägre än beloppet som ska satsas.

Om auto-spin körs och ett bet blockeras:

- bettet hoppas över
- auto-spin fortsätter
- serien stängs som blockerad
- en varning visas i UI:t
- varningen visar försökt belopp
- varningen visar föreslagen färg
- varningen visar streaken som triggade
- varningen visar saldot direkt före det blockerade bet-försöket

Bet Log visar också `Saldo före` för bets som faktiskt placerades.

## Paneler

### Simulator

Visar senaste resultatet och innehåller:

- `Spin`
- `Start auto-spin`
- `Stop auto-spin`
- `Intervall (ms)`

### Bot Control

Innehåller alla strategi- och botinställningar:

- bot på/av
- grundinsats
- streak-tröskel
- strategi
- insatsmodell
- max progression steps
- sessionregler
- riskregler
- signal efter längre streaks
- streak lock och reentry
- aktuellt väntande bet

### Strategy Safety

Visar:

- progression mode
- aktiv serie eller `No active series`
- current step / max steps
- nästa bet amount
- max möjlig capped-förlust
- locked streak status
- session status
- session profit
- kvar till profit target
- risknivå

### History

Visar:

- senaste 30 resultaten som färgade cirklar
- totalt antal spins
- antal red
- antal black
- antal green

### Signal

Visar:

- aktuell streak
- vald tröskel
- Martingale-status
- senaste eller aktuella signalen

### Bankroll

Visar:

- startsaldo, `1000 kr`
- nuvarande saldo
- total vinst/förlust
- antal bets
- antal vunna bets
- antal förlorade bets
- win rate
- ROI

### Strategimätning

Visar extra mätvärden för att analysera strategin:

- `Röd/svart spins`: antal spins som inte är green.
- `Green rate`: andel spins som blev green.
- `Omsättning`: total summa satsad på avgjorda bets.
- `Betfrekvens`: avgjorda bets dividerat med antal spins.
- `Snittinsats`: genomsnittlig insats.
- `Maxinsats`: största placerade insats.
- `Max drawdown`: största fall från tidigare toppsaldo.
- `Expectancy`: genomsnittlig vinst/förlust per bet.
- `Profit factor`: total vinst dividerat med total förlust.
- `Längsta vinstsvit`: flest vinster i rad.
- `Längsta förlustsvit`: flest förluster i rad.
- `Green-förluster`: antal bets som förlorade på green.
- `Martingale-steg`: antal gånger insatsen ökade jämfört med föregående avgjorda bet.
- `Antal serier`: antal stängda serier.
- `Vunna serier`: serier som stängts som `won`.
- `Capped losses`: serier som stängts som `lost_capped`.
- `Blockerade serier`: serier som stoppats av bankroll eller maxbet-regler.
- `Series win rate`: vunna serier dividerat med antal stängda serier.
- `Snitt serieprofit`: genomsnittlig net profit per serie.
- `Bästa serie`: högsta serieprofit.
- `Sämsta serie`: lägsta serieprofit.
- `Locked streak count`: om en streak är låst just nu.
- `Target-stopp`: antal sessionsstopp via profit target.

### Bet Log

Tabellen visar bets med paginering.

Kolumner:

- `Spin`: spin där bettet placerades.
- `Signal`: streak som triggade bettet.
- `Bet färg`: färgen botten bettade på.
- `Amount`: insatsen.
- `Saldo före`: saldot före bettet avgjordes eller placerades.
- `Nästa spin`: spin-resultatet som avgjorde bettet.
- `Vinst/förlust`: profit för bettet.
- `Saldo efter`: saldo efter avgjort bet.

## Data som sparas

Appen sparar data i `localStorage` under nyckeln:

```text
betting-strategy-simulator-v1
```

Följande sparas:

- historik
- saldo
- bet-logg
- bot enabled/disabled
- bet amount
- strategy
- streak-tröskel
- signal efter längre streaks
- progressionMode
- maxProgressionSteps
- activeSeries
- seriesLog
- lockedStreak
- sessionStartBalance
- sessionStatus
- profitTarget
- lockAfterCappedLoss
- auto-spin-intervall

## Reset-knappar

`Reset simulation` rensar historik och bet-logg men behåller inställningar och saldo.

`Reset bankroll` återställer saldot till `1000 kr` och rensar bet-loggen.

`Reset everything` rensar localStorage och återställer allt till standard.

## Viktiga typer

```ts
type Color = "red" | "black" | "green";
type BetColor = "red" | "black";
type Strategy = "same" | "opposite";

type SpinResult = {
  id: number;
  color: Color;
  timestamp: number;
};

type Signal = {
  streakColor: BetColor;
  streakLength: number;
  suggestedBetColor: BetColor;
  amount: number;
  createdAtSpinId: number;
};

type Bet = {
  id: number;
  signal: Signal;
  betColor: BetColor;
  amount: number;
  placedAtSpinId: number;
  balanceBefore?: number;
  resolvedAtSpinId?: number;
  resultColor?: Color;
  outcome?: "win" | "loss";
  profit?: number;
  balanceAfter?: number;
};
```

## Kodstruktur

```text
src/
  App.tsx
  main.tsx
  types.ts
  utils/
    roulette.ts
    streakUtils.ts
    strategyEngine.ts
    botEngine.ts
    storage.ts
  components/
    SimulatorPanel.tsx
    BotControlPanel.tsx
    HistoryPanel.tsx
    SignalPanel.tsx
    BankrollPanel.tsx
    BetLogPanel.tsx
    StatsPanel.tsx
```

## Varför strategin inte ger positivt väntevärde

Streaks och Martingale kan kännas intuitiva, men varje spin är oberoende. Sannolikheten för red, black och green ändras inte av tidigare resultat.

Martingale minskar inte husets fördel. Det flyttar risk framåt genom att öka insatsen efter förlust. När en lång förlustsvit kommer kan insatsen snabbt bli större än saldot.

Eftersom `green` alltid gör att ett bet på red eller black förlorar finns ett negativt väntevärde över tid, även om korta perioder kan visa vinst.
