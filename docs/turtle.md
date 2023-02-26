# Turtle

## Example program:
```rs
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

## `Forward`
Moves the turtle forward one block in the direction it is facing. If the block in front of the turtle is not air, the turtle will not move.

- Parameters - `This method does not take any parameters`
- Returns - `void`

```rs
Turtle::Forward();
```

## `TurnLeft`
The turtle will turn left, the turtle remains on the same block.

- Parameters - `This method does not take any parameters`
- Returns - `void`

```rs
Turtle::TurnLeft();
```

## `TurnRight`
The turtle will turn right, the turtle remains on the same block.

- Parameters - `This method does not take any parameters`
- Returns - `void`

```rs
Turtle::TurnRight();
```

## `InspectDown`
The turtle will get the ID of the block below it

- Parameters - `This method does not take any parameters`
- Returns - `String`

```rs
Turtle::InspectDown();
```