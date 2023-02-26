# Turtle Struct

## Example Usage:
```rs:line-numbers
// If the block below the turtle is grass
if (Turtle::InspectDown() == "minecraft:grass") {
    // Move the turtle forwards
    Turtle::Forward();
}
else {
    // If it is not grass turn right and go forward
    Turtle::TurnRight();
    Turtle::Forward();
}
```

## Movement

### `Forward`
Moves the turtle forward one block in the direction it is facing. 
If the block in front of the turtle is not air, the turtle will not move.
- Parameters - `None`
- Returns - `void`

### `TurnLeft`
The turtle will turn left, the turtle remains on the same block.
- Parameters - `None`
- Returns - `void`

### `TurnRight`
The turtle will turn right, the turtle remains on the same block.
- Parameters - `None`
- Returns - `void`


## Inspecting

### `InspectDown`
The turtle will get the ID of the block below it
- Parameters - `None`
- Returns - `String`