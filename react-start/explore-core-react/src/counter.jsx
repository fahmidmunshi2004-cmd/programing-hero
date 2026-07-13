import { useState } from "react"

export default function Counter() {
    const [count, setCount] = useState(0)
    const hendelAdd = () => {
        const newcount = count + 1;
        setCount(newcount)
    }
    const btnStyle = {
        color: 'white',
        fontSize: '16px',
        cursor: 'pointer'
    }
    return (
        <div>
            <h3>Count : {count}</h3>
            <button style={btnStyle} onClick={hendelAdd}>Add</button>
        </div>
    )
}