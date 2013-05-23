/**
 * Created with JetBrains WebStorm.
 * User: firefish
 * Date: 23/05/13
 * Time: 02:11
 * To change this template use File | Settings | File Templates.
 */
var A1 = 5.0;
var A2 = 15.0;
var B2 = 8.0;
var C1 = 4.0;
var C2 = 7.0;
var nu = 1.0;
var eps = 0.60;
var DELTA = 3.0;
var DIM = 2;
var PI = 3.1415926535897932384626433832795029;
var EGOROVS_CONST = 8;

function F(number_of_equation, time, y, G) {//Right-hand of dynamical system
    var value;

    switch (number_of_equation)
    { //   RIGHT-HANDS OF DIFFERENTIAL EQUATIONS SYSTEM:

        /* If You have another dimention (DIM is define in "#define DIM YOU_DIM_NUMBER") of system then add or remove your equations*/

        case 0: /* First equation */
            value = y[1]*(1/C2-Math.cos(y[0])*Math.cos(y[0])/(A1+B2)-Math.sin(y[0])*Math.sin(y[0])/(A1+A2))-DELTA/C2-eps/C2/nu*Math.sin(nu*time);
            break;
        case 1: /* 2_equation */
            value = -(G*G-y[1]*y[1])*(1/(A1+A2)-1/(A1+B2))*Math.sin(y[0])*Math.cos(y[0]);
            break; //
        default:
            value=0;
            break;
    }

    return value;
}

function Section(time){//Puancare cross-section formula
    return Math.sin((nu*time)/2);// repetition of the phase:  nu*time=nu*time+2*Pi
}

function RK45(t, T, x, X, StepInteger, G){
//Function for evaluation of arrays kj[], X[]
//Function return control term value
    var k1 = [], k2 = [], k3 = [], k4 = []; //arrays for RK45 and ControlTerm evaluation
    var x_k1 = [], x_k2 = [], x_k3 = [];
    var i;
    var val=0;
    var temp=0;

    for (i=0; i<DIM; i++)
    {
        k1[i]=StepInteger*F(i, t, x, G);
        x_k1[i]=x[i]+0.5*k1[i];
    }

    for (i=0; i<DIM; i++)
    {
        k2[i]=StepInteger*F(i,t+0.5*StepInteger,x_k1, G);
        x_k2[i]=x[i]+0.5*k2[i];
    }

    for (i=0; i<DIM; i++)
    {
        k3[i]=StepInteger*F(i,t+0.5*StepInteger,x_k2, G);
        x_k3[i]=x[i]+k3[i];
    }

    for (i=0; i<DIM; i++)
    {
        k4[i]=StepInteger*F(i,t+StepInteger,x_k3, G);
    }

    for (i=0; i<DIM; i++)
    {
        X[i]=x[i]+(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6;
    }
    T[0]=t+StepInteger;

    for (i=0;i<DIM;i++)//evaluation of Egorov's control term:
    {
        temp=Math.abs(k1[i]-k2[i]-k3[i]+k4[i])*2/3;
        if (temp>val) {
            val=temp;
        }
    }
    return val;
}

function fmod(a,b){
    return a % b;
}

function process_trajectory(input){
    var t = 0;
    var x = [], X = [];//arrays for start and final point of one iteration
    var T = [];
    var NumPointsOnMap_NOW = 0;
    var rk_temp, StepTemp;
    var StepIntegr = input.StepIntegr;
    var i;
    var res = new Object();
    res.points = [];

    for(i=0;i<DIM;i++)
        x[i]=input.x[i];

    while (NumPointsOnMap_NOW<input.NumPointsOnMap) //finding of each point of the Poincare-map
    {//1
        //---------------ONE ITERATION WITH CONTROL TERM---------------

        rk_temp=RK45(t, T, x, X, StepIntegr, input.G);//execute of one iteration of Runge-Kutta method

        while (rk_temp>input.TolIntegr)
        {//autochanging of StepIntegr_SIZE
            StepIntegr/=2;
            rk_temp=RK45(t, T, x, X, StepIntegr, input.G);
        }

        while (rk_temp<=input.TolIntegr/EGOROVS_CONST)
        {
            StepIntegr*=2;
            rk_temp=RK45(t, T, x, X, StepIntegr, input.G);
        }//autochanging of StepIntegr_SIZE */

        //----------------END OF ITERATION-----------------------------



        //-----------INTERSECTION FINDING------------------------------
        var SectionBefore, SectionAfter;// values of section function befor and after intersection
        SectionBefore=Section(t);
        SectionAfter=Section(T[0]);

        if (SectionBefore*SectionAfter<0)//then we have intersection on this iteration-interval
        {//2
            if (SectionBefore>0)//(X[3]>x[3])
            {// direction of trajectory transpotation control
                StepTemp=StepIntegr;//Let's save in memory step size befor finding

                while (Math.abs(SectionAfter)>input.TolOfSection) //correction of tolerance of point
                {//3
                    if (SectionBefore*SectionAfter<0) StepIntegr*=0.5; else StepIntegr*=1.5;
                    RK45(t, T, x, X, StepIntegr, input.G);
                    SectionAfter=Section(T);
                    //This method corespond to "half-secant" ideology
                }//3

                StepIntegr=StepTemp;//restor step size

                res.points[NumPointsOnMap_NOW*DIM] = fmod((fmod(x[0],2*PI)+2*PI),2*PI);
                res.points[NumPointsOnMap_NOW*DIM+1] = x[1]/input.G;
                NumPointsOnMap_NOW++;

            }// direction of trajectory transpotation control
        }//2
        //----CHANGING OF START-FINAL POINTS FOR FURTHER ITERATIONS-----
        for (i=0;i<DIM;i++)
            x[i]=X[i];
        t=T[0];
    }//1
    res.num = input.num;
    res.thread = input.thread;
    return res;
}



self.onmessage = function(e) {
    self.postMessage(process_trajectory(e.data));
};