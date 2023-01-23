const { ethers } = require("ethers");
const { abi: IUniswapV3PoolABI } = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const { abi: QuoterABI } = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json");
const {WebSocketProvider} = require("./websocket")
const fs = require("fs");

async function isForward(poolPair,basesymbol){  
    var a =poolPair.indexOf("/")
    var base = poolPair.substring(0,a)
    if (base == basesymbol){
        return true
    }
    else{
        return false
    }
}

async function reverPair(poolPair){
    var a =poolPair.indexOf("/")
    var base = poolPair.substring(0,a)
    var quote = poolPair.substring(a+1,poolPair.length)
    return quote+"/"+base
}


async function getquote(poolPair,baseSymbol){
    var a =poolPair.indexOf("/")
    var base = poolPair.substring(0,a)
    if (baseSymbol == base){
        var quote = poolPair.substring(a+1,poolPair.length)
        return quote
    }else{
        return base
    }
}

function sleep(d) {
    for(var t = Date.now(); Date.now() - t <= d;);
}

class PairWS {
    constructor(poolPair,baseSymbol,baseTokenDecimal,quoteTokenDecimal,fee,base_smybo_addr,quote_smybo_addr,INFURA_URL_MAINNET_WS,INFURA_URL_MAINNET,POOL_ADDR,QUOTER_ADDR,DB_session = null,spot) { 
        this.INFURA_URL_MAINNET_WS = INFURA_URL_MAINNET_WS;
        this.spot = spot
        this.fee = fee;
        this.base_smybo_addr = base_smybo_addr;
        this.quote_smybo_addr = quote_smybo_addr;
        this.INFURA_URL_MAINNET = INFURA_URL_MAINNET; 
        this.POOL_ADDR = POOL_ADDR;
        this.QUOTER_ADDR = QUOTER_ADDR;
        this.poolPair = poolPair;
        this.baseSymbol = baseSymbol;
        this.baseTokenDecimal = baseTokenDecimal;
        this.quoteTokenDecimal = quoteTokenDecimal;
        this.DB_session = DB_session;
        console.log(spot)
        this.providerws = new WebSocketProvider(INFURA_URL_MAINNET_WS,spot);
        this.init();
        // this.reconnectInit();

     }
     async init(){
        const provider = new ethers.providers.JsonRpcProvider(this.INFURA_URL_MAINNET)
        const quoterContract = new ethers.Contract(
            this.QUOTER_ADDR,
            QuoterABI,
            provider
          )
          const amountIn = ethers.utils.parseUnits(
            "1",
            this.baseTokenDecimal
          )
        const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
            this.base_smybo_addr,
            this.quote_smybo_addr,
            this.fee,
            amountIn,
            0 
          )

          var timestamp=new Date().getTime();
          var poolpair = this.poolPair
          if (isForward(this.poolPair,this.baseSymbol) != true){
              poolpair = await reverPair(this.poolPair)
          }
          const amountOut = ethers.utils.formatUnits(quotedAmountOut, this.quoteTokenDecimal)
          const quoteSymbol = await getquote(this.poolPair,this.baseSymbol)
          console.log(`${timestamp} 1 ${this.baseSymbol} can be swapped for ${amountOut} ${quoteSymbol}`)
          if (this.DB_session != null){
              this.SaveData(1,amountOut,poolpair,timestamp)
          }
     }
     async reconnectInit(){
        this.providerws._websocket.on("close",async () =>{
            console.log('The websocket connection was closed');
            this.providerws._wsReady = false;
            try{
                const newws = await new PairWS(
                    this.poolPair,
                    this.baseSymbol,
                    this.baseTokenDecimal,
                    this.quoteTokenDecimal,
                    this.fee,
                    this.base_smybo_addr,
                    this.quote_smybo_addr,
                    this.INFURA_URL_MAINNET_WS,
                    this.INFURA_URL_MAINNET,
                    this.POOL_ADDR,
                    this.QUOTER_ADDR);
                    newws.start()
        }catch (e){
            console.log('reconnect is ERROR!---' + e.toString);
        }
        })
     }


     async start(){
        const poolContract = new ethers.Contract(
            this.POOL_ADDR,
            IUniswapV3PoolABI,
            this.providerws
            )
        const quoterContract = new ethers.Contract(
            this.QUOTER_ADDR,
            QuoterABI,
            this.providerws
            )
        const amountIn = ethers.utils.parseUnits(
            "1",
            this.baseTokenDecimal
            )
        const quoteSymbol = await getquote(this.poolPair,this.baseSymbol)

        // while (true) {
        //     let quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
        //         this.base_smybo_addr,
        //         this.quote_smybo_addr,
        //         this.fee,
        //         amountIn,
        //         0
        //         );
        //     var timestamp=new Date().getTime();
        //     let amountOut = ethers.utils.formatUnits(quotedAmountOut, this.quoteTokenDecimal);
        //      console.log(`${timestamp} ${amount} ${this.baseSymbol} can be swapped for ${amountOut} ${quoteSymbol}`)
        //      sleep(3000)
        // }

        poolContract.on("Swap",async (sender,recipient,amount0,amount1,sqrtPriceX96,liquidity,tick,event) =>{

            fs.writeFile('./log.txt', `${_this.spot}---${new Date().getTime()} Swap事件触发！`, {flag: 'a',}, (err) => {
                if (err) {
                  console.error(err)
                }
              })
            const quotedAmountOut = await quoterContract.callStatic.quoteExactInputSingle(
                this.base_smybo_addr,
                this.quote_smybo_addr,
                this.fee,
                amountIn,
                0
                )
            var timestamp=new Date().getTime();
            var poolpair = this.poolPair
            if (isForward(this.poolPair,this.baseSymbol) != true){
                poolpair = await reverPair(this.poolPair)
            }
            const amountOut = ethers.utils.formatUnits(quotedAmountOut, this.quoteTokenDecimal)
            fs.writeFile('./log.txt', `${timestamp} 1 ${this.baseSymbol} can be swapped for ${amountOut} ${quoteSymbol}`, {flag: 'a',}, (err) => {
                if (err) {
                  console.error(err)
                }
              })
            if (this.DB_session != null){
                this.SaveData(1,amountOut,poolpair,timestamp)
            }
        })

     }
     async  SaveData(amountIn,amountOut,poolPair,timestamp){
        poolPair = await poolPair.replace("/","_")     
        fs.writeFile('./log.txt', `正在存入数据中.........`, {flag: 'a',}, (err) => {
            if (err) {
              console.error(err)
            }
          })
        this.DB_session.InsertData(timestamp,poolPair,amountIn,amountOut)

    }
    

}

exports.PairWS = PairWS
