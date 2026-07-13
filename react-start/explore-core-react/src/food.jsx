// export default function Food({ name, isDone }) {
//     const foodStyle = {
//         color: 'red',
//         fontSize: '30px'
//     }
//     return (
//         <div style={foodStyle}>
//             <ul>
//                 <li style={{
//                     listStyle: "none"
//                 }}>
//                     I am: {name}
//                 </li>
//             </ul>
//         </div>
//     );
// }
export default function Food({ name, isDone, time = 0 }) {
    const foodStyle = {
        color: "red",
        fontSize: "30px",
    };

    if (isDone === true) {
        return (
            <div style={foodStyle}>
                <li
                    style={{
                        listStyle: "none",
                        marginBottom: '20px',
                    }}>I am: {name} ✅ {time}</li>
            </div >
        );
    }
    else {
        return (
            <div style={foodStyle}>
                <li
                    style={{
                        listStyle: "none",
                        marginBottom: '20px',
                    }}>I am: {name} ❌</li>
            </div >


        );
    }

}