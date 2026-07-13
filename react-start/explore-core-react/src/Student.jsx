export default function Student({ student }) {
    return (
        <div>
            <h3>Name: {student.name}</h3>
            <p>Age: {student.age}</p>
        </div>
    );
}