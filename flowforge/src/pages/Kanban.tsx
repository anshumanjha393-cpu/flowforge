import { useState } from "react";
import {
    DragDropContext,
    Droppable, Draggable
} from "@hello-pangea/dnd"
function Kanban() {
    const [tasks, setTasks] = useState([
        {
            id: "1",
            title: "Build Login Page",
            status: "TODO"
        },
        {
            id: "2",
            title: "Style with modern CSS",
            status: "TODO"
        },
        {
            id: "3",
            title: "Setup Prisma",
            status: "IN_PROGRESS"
        },
        {
            id: "4",
            title: "Deploy Backend",
            status: "DONE"
        },
        {
            id: "5",
            title: "Integrate AI & LLM",
            status: "IN_PROGRESS"
        }

    ])





    //adding a task with priority
    const [newTask, setNewTask] = useState("");
    const addTask = () => {
        if (!newTask.trim()) return;
        const task = {
            id: Date.now().toString(),
            title: newTask,
            status: "TODO", priority,
        }
        setTasks([...tasks, task])
        setNewTask("")
    }

    const [priority, setPriority] = useState("MEDIUM")



    ///moving tasks left and right
    const moveTask = (id: string) => {
        setTasks(
            tasks.map((task) => {
                if (task.id === id) {
                    return task
                }
                if (task.status === "TODO") {
                    return { ...task, status: "IN_PROGRESS" }
                }
                if (task.status === "IN_PROGRESS") {
                    return { ...task, status: "DONE" }
                }
                return task;
            })
        )
    }

    const moveLeft = (id: string) => {
        setTasks(
            tasks.map((task) => {
                if (task.id !== id) return task;

                if (task.status === "IN_PROGRESS")
                    return { ...task, status: "TODO" };

                if (task.status === "DONE")
                    return { ...task, status: "IN_PROGRESS" };

                return task;
            })
        );
    };

    const moveRight = (id: string) => {
        setTasks(
            tasks.map((task) => {
                if (task.id !== id) return task;

                if (task.status === "TODO")
                    return { ...task, status: "IN_PROGRESS" };

                if (task.status === "IN_PROGRESS")
                    return { ...task, status: "DONE" };

                return task;
            })
        );
    };

    //dragDrop

    const onDragEnd = (result: any) => {
        if (!result.destination) return;

        const taskId = result.draggableId;
        const newStatus = result.destination.droppableId;

        setTasks(
            tasks.map((task) =>
                task.id === taskId
                    ? { ...task, status: newStatus }
                    : task
            )
        );
    };
    return (
        <DragDropContext onDragEnd={onDragEnd}>

            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">
                    FlowForge Board
                </h1>
                <div className="mb-6 flex gap-2">
                    <input type="text" value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Enter Task"
                        className="border p-2 rounded flex-1" />
                    <select value={priority} onChange={(e) => { setPriority(e.target.value) }}
                        className="border p-2 rounded">
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                    </select>

                    <button onClick={addTask} className="bg-green-500 text-white px-4 py-2 rounded">
                        Add Task
                    </button>

                </div>

                <div className="grid grid-cols-3 gap-6">
                    <Droppable droppableId="TODO">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="bg-gray-100 p-4 rounded"
                            >
                                <h2 className="font-bold mb-4">Todo</h2>

                                {tasks
                                    .filter(task => task.status === "TODO")
                                    .map((task, index) => (
                                        <Draggable
                                            draggableId={task.id}
                                            index={index}
                                            key={task.id}
                                        >
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="bg-white p-3 rounded shadow mb-2"
                                                >
                                                    <p>{task.title}</p>

                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => moveLeft(task.id)}
                                                            className="px-2 py-1 bg-gray-300 rounded"
                                                        >
                                                            ←
                                                        </button>

                                                        <button
                                                            onClick={() => moveRight(task.id)}
                                                            className="px-2 py-1 bg-blue-500 text-white rounded"
                                                        >
                                                            →
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>

                    <Droppable droppableId="IN_PROGRESS">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="bg-gray-100 p-4 rounded"
                            >
                                <h2 className="font-bold mb-4">
                                    In Progress
                                </h2>

                                {tasks
                                    .filter(
                                        task => task.status === "IN_PROGRESS"
                                    )
                                    .map((task, index) => (
                                        <Draggable
                                            draggableId={task.id}
                                            index={index}
                                            key={task.id}
                                        >
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="bg-white p-3 rounded shadow mb-2"
                                                >
                                                    <p>{task.title}</p>

                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => moveLeft(task.id)}
                                                            className="px-2 py-1 bg-gray-300 rounded"
                                                        >
                                                            ←
                                                        </button>

                                                        <button
                                                            onClick={() => moveRight(task.id)}
                                                            className="px-2 py-1 bg-blue-500 text-white rounded"
                                                        >
                                                            →
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                    <Droppable droppableId="DONE">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="bg-gray-100 p-4 rounded"
                            >
                                <h2 className="font-bold mb-4">Done</h2>

                                {tasks
                                    .filter(task => task.status === "DONE")
                                    .map((task, index) => (
                                        <Draggable
                                            draggableId={task.id}
                                            index={index}
                                            key={task.id}
                                        >
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="bg-white p-3 rounded shadow mb-2"
                                                >
                                                    <p>{task.title}</p>

                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => moveLeft(task.id)}
                                                            className="px-2 py-1 bg-gray-300 rounded"
                                                        >
                                                            ←
                                                        </button>

                                                        <button
                                                            onClick={() => moveRight(task.id)}
                                                            className="px-2 py-1 bg-blue-500 text-white rounded"
                                                        >
                                                            →
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </div>
        </DragDropContext>
    );
}

export default Kanban